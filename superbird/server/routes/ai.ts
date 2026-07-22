import { Hono } from 'hono'
import { requireAuth } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import { getAiConfig, setAiConfig, publicConfig, callProvider, isUsable } from '../lib/ai'
import type { AiChatRequest, AiConfigUpdate, AiProvider } from '../../shared/types'

const PROVIDERS: AiProvider[] = ['anthropic', 'openai', 'groq', 'custom']

const ai = new Hono()

ai.use('*', requireAuth)

// Public config: whether a key is set, provider + model (never the key).
ai.get('/ai/config', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json(publicConfig(proj.id))
})

ai.put('/ai/config', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as AiConfigUpdate
  if (!PROVIDERS.includes(body.provider)) {
    return c.json({ error: 'Invalid provider.' }, 400)
  }
  return c.json(
    setAiConfig(proj.id, {
      provider: body.provider,
      apiKey: body.apiKey,
      model: body.model?.trim() || 'claude-sonnet-5',
      baseUrl: body.baseUrl,
    }),
  )
})

// Proxy one turn to the configured provider. The client runs the agent loop and
// executes tool calls against the live document; the server only relays.
ai.post('/ai/chat', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const cfg = getAiConfig(proj.id)
  if (!isUsable(cfg)) return c.json({ error: 'AI is not configured. Set it up in Settings → Integration.' }, 400)
  const req = (await c.req.json()) as AiChatRequest
  try {
    return c.json(await callProvider(cfg, req))
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'AI request failed.' }, 502)
  }
})

export default ai
