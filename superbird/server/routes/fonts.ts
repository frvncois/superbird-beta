import { Hono } from 'hono'
import { requireAuth } from '../lib/session'
import { saveCustomFace, deleteFontFiles } from '../lib/fonts'

const fontsApi = new Hono()

// All font admin routes require an authenticated admin.
fontsApi.use('*', requireAuth)

// Upload a custom font file (one weight/style face). The bytes are self-hosted
// and served publicly at /fonts/:file.
fontsApi.post('/fonts/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) return c.json({ error: 'No file.' }, 400)
  const weight = typeof body['weight'] === 'string' ? body['weight'] : '400'
  const style = body['style'] === 'italic' ? 'italic' : 'normal'
  const bytes = Buffer.from(await file.arrayBuffer())
  try {
    return c.json(saveCustomFace(bytes, file.name, weight, style), 201)
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Invalid font file.' }, 400)
  }
})

// Delete self-hosted upload files for a removed font family (reclaims disk).
// Only touches uploaded files in data/fonts/; bundled defaults are untouched.
fontsApi.post('/fonts/delete', async (c) => {
  const { urls } = (await c.req.json()) as { urls?: string[] }
  if (Array.isArray(urls) && urls.length) deleteFontFiles(urls)
  return c.json({ ok: true })
})

export default fontsApi
