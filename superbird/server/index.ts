import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ensureSchema } from './db/client'
import authRoutes from './routes/auth'
import projectRoutes from './routes/project'
import mediaRoutes from './routes/media'
import fontsRoutes from './routes/fonts'
import usersRoutes from './routes/users'
import aiRoutes from './routes/ai'
import siteRoutes from './routes/site'
import { readMediaFile } from './lib/media'
import { readFontFile } from './lib/fonts'

ensureSchema()

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', authRoutes)
app.route('/api', projectRoutes)
app.route('/api', mediaRoutes)
app.route('/api', fontsRoutes)
app.route('/api', usersRoutes)
app.route('/api', aiRoutes)

// Public media files (no auth — referenced by published pages).
app.get('/media/:id', (c) => {
  const file = readMediaFile(c.req.param('id'))
  if (!file) return c.notFound()
  return new Response(file.bytes, {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

// Public font files (no auth — referenced by @font-face in published pages).
app.get('/fonts/:file', (c) => {
  const file = readFontFile(c.req.param('file'))
  if (!file) return c.notFound()
  return new Response(file.bytes, {
    headers: {
      'Content-Type': file.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

// Public SSR site — catch-all, registered last so /api and /media win.
app.route('/', siteRoutes)

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Superbird API listening on http://localhost:${info.port}`)
})
