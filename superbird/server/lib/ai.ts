import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { aiConfig } from '../db/schema'
import type {
  AiBlock,
  AiChatRequest,
  AiChatResponse,
  AiConfigPublic,
  AiConfigUpdate,
  AiProvider,
} from '../../shared/types'

interface AiConfigRow {
  provider: AiProvider
  apiKey: string
  model: string
}

const DEFAULTS: AiConfigRow = { provider: 'anthropic', apiKey: '', model: 'claude-sonnet-5' }

export function getAiConfig(projectId: string): AiConfigRow {
  const row = db.select().from(aiConfig).where(eq(aiConfig.projectId, projectId)).get()
  if (!row) return DEFAULTS
  return { provider: row.provider as AiProvider, apiKey: row.apiKey, model: row.model }
}

export function publicConfig(projectId: string): AiConfigPublic {
  const c = getAiConfig(projectId)
  return { configured: c.apiKey.length > 0, provider: c.provider, model: c.model }
}

export function setAiConfig(projectId: string, update: AiConfigUpdate): AiConfigPublic {
  const existing = getAiConfig(projectId)
  const apiKey = update.apiKey && update.apiKey.length > 0 ? update.apiKey : existing.apiKey
  const row = { projectId, provider: update.provider, apiKey, model: update.model }
  db.insert(aiConfig)
    .values(row)
    .onConflictDoUpdate({ target: aiConfig.projectId, set: { provider: row.provider, apiKey, model: row.model } })
    .run()
  return publicConfig(projectId)
}

const MAX_TOKENS = 4096

// ── Anthropic ──
// The normalized wire format IS Anthropic-shaped, so messages/tools pass through.
async function callAnthropic(cfg: AiConfigRow, req: AiChatRequest): Promise<AiChatResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: MAX_TOKENS,
      system: req.system,
      messages: req.messages,
      tools: req.tools,
    }),
  })
  if (!res.ok) throw new Error(await providerError(res, 'Anthropic'))
  const data = (await res.json()) as { content: AiBlock[]; stop_reason: string }
  return { content: data.content ?? [], stopReason: normalizeStop(data.stop_reason) }
}

// ── OpenAI ──
// Translate the normalized (Anthropic-shaped) format ↔ OpenAI chat completions.
async function callOpenAI(cfg: AiConfigRow, req: AiChatRequest): Promise<AiChatResponse> {
  const messages: unknown[] = [{ role: 'system', content: req.system }]
  for (const m of req.messages) {
    if (m.role === 'user') {
      // Split into plain-text user turns and tool-result turns.
      const text = m.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n')
      const results = m.content.filter((b) => b.type === 'tool_result')
      if (text) messages.push({ role: 'user', content: text })
      for (const r of results as Array<{ tool_use_id: string; content: string }>) {
        messages.push({ role: 'tool', tool_call_id: r.tool_use_id, content: r.content })
      }
    } else {
      const text = m.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('\n')
      const toolUses = m.content.filter((b) => b.type === 'tool_use') as Array<{ id: string; name: string; input: unknown }>
      const msg: Record<string, unknown> = { role: 'assistant', content: text || null }
      if (toolUses.length) {
        msg.tool_calls = toolUses.map((t) => ({
          id: t.id,
          type: 'function',
          function: { name: t.name, arguments: JSON.stringify(t.input ?? {}) },
        }))
      }
      messages.push(msg)
    }
  }
  const tools = req.tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }))
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, max_tokens: MAX_TOKENS, messages, tools }),
  })
  if (!res.ok) throw new Error(await providerError(res, 'OpenAI'))
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> }; finish_reason: string }>
  }
  const choice = data.choices?.[0]
  const content: AiBlock[] = []
  if (choice?.message.content) content.push({ type: 'text', text: choice.message.content })
  for (const tc of choice?.message.tool_calls ?? []) {
    let input: Record<string, unknown> = {}
    try {
      input = JSON.parse(tc.function.arguments || '{}')
    } catch {
      /* leave empty on malformed args */
    }
    content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input })
  }
  const stopReason = choice?.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn'
  return { content, stopReason }
}

function normalizeStop(s: string): AiChatResponse['stopReason'] {
  if (s === 'tool_use') return 'tool_use'
  if (s === 'max_tokens') return 'max_tokens'
  return 'end_turn'
}

async function providerError(res: Response, name: string): Promise<string> {
  const body = await res.text().catch(() => '')
  let detail = body
  try {
    const j = JSON.parse(body)
    detail = j.error?.message ?? body
  } catch {
    /* keep raw text */
  }
  return `${name} error (${res.status}): ${detail?.slice(0, 300) || 'request failed'}`
}

export function callProvider(cfg: AiConfigRow, req: AiChatRequest): Promise<AiChatResponse> {
  return cfg.provider === 'openai' ? callOpenAI(cfg, req) : callAnthropic(cfg, req)
}
