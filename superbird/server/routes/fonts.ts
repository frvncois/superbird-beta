import { Hono } from 'hono'
import { currentUser } from '../lib/session'
import { searchFonts, importWebFont, saveCustomFace } from '../lib/fonts'
import type { FontImportPayload } from '../../shared/types'

const fontsApi = new Hono()

// All font admin routes require an authenticated admin.
fontsApi.use('/fonts/*', async (c, next) => {
  if (!currentUser(c)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

// Browse the catalog (Google live via API key, Fontshare bundled).
fontsApi.get('/fonts/search', async (c) => {
  const source = c.req.query('source') === 'fontshare' ? 'fontshare' : 'google'
  const q = c.req.query('q') ?? ''
  try {
    return c.json({ items: await searchFonts(source, q) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Search failed.'
    if (msg === 'NO_GOOGLE_KEY') return c.json({ error: 'NO_GOOGLE_KEY' }, 400)
    return c.json({ error: msg }, 502)
  }
})

// Import a font: fetch its CSS, download the woff2s, self-host them.
fontsApi.post('/fonts/import', async (c) => {
  const payload = (await c.req.json()) as FontImportPayload
  if (!payload?.family || (payload.source !== 'google' && payload.source !== 'fontshare')) {
    return c.json({ error: 'Invalid request.' }, 400)
  }
  try {
    return c.json(await importWebFont(payload), 201)
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Import failed.' }, 502)
  }
})

// Upload a custom font file (one weight/style face).
fontsApi.post('/fonts/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) return c.json({ error: 'No file.' }, 400)
  const weight = typeof body['weight'] === 'string' ? body['weight'] : '400'
  const style = body['style'] === 'italic' ? 'italic' : 'normal'
  const bytes = Buffer.from(await file.arrayBuffer())
  const face = saveCustomFace(bytes, file.name, weight, style)
  return c.json(face, 201)
})

export default fontsApi
