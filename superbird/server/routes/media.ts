import { Hono } from 'hono'
import { currentUser } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import {
  listMedia,
  createMedia,
  updateMedia,
  deleteMedia,
  createFolder,
  renameFolder,
  deleteFolder,
  getCompressionSettings,
} from '../lib/media'

const mediaApi = new Hono()

// All media API routes require an authenticated admin.
mediaApi.use('/media/*', async (c, next) => {
  if (!currentUser(c)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

mediaApi.get('/media', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json(listMedia(proj.id))
})

mediaApi.post('/media', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) return c.json({ error: 'No file.' }, 400)
  const width = body['width'] ? Number(body['width']) : undefined
  const height = body['height'] ? Number(body['height']) : undefined
  const bytes = Buffer.from(await file.arrayBuffer())
  const item = await createMedia(
    proj.id,
    {
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
      bytes,
    },
    getCompressionSettings(proj.id),
  )
  return c.json(item, 201)
})

mediaApi.patch('/media/:id', async (c) => {
  const body = (await c.req.json()) as {
    name?: string
    alt?: string
    tags?: string[]
    folderId?: string | null
  }
  const item = updateMedia(c.req.param('id'), body)
  if (!item) return c.json({ error: 'Not found.' }, 404)
  return c.json(item)
})

mediaApi.delete('/media/:id', (c) => {
  deleteMedia(c.req.param('id'))
  return c.json({ ok: true })
})

// ── Folders ──
mediaApi.post('/media/folders', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const { name, parentId } = (await c.req.json()) as { name: string; parentId?: string }
  return c.json(createFolder(proj.id, name, parentId), 201)
})

mediaApi.patch('/media/folders/:id', async (c) => {
  const { name } = (await c.req.json()) as { name: string }
  renameFolder(c.req.param('id'), name)
  return c.json({ ok: true })
})

mediaApi.delete('/media/folders/:id', (c) => {
  deleteFolder(c.req.param('id'))
  return c.json({ ok: true })
})

export default mediaApi
