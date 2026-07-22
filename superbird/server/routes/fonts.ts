import { Hono } from 'hono'
import { currentUser } from '../lib/session'
import { saveCustomFace } from '../lib/fonts'

const fontsApi = new Hono()

// All font admin routes require an authenticated admin.
fontsApi.use('/fonts/*', async (c, next) => {
  if (!currentUser(c)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

// Upload a custom font file (one weight/style face). The bytes are self-hosted
// and served publicly at /fonts/:file.
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
