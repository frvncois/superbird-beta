import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ensureSchema } from './db/client'
import authRoutes from './routes/auth'
import projectRoutes from './routes/project'
import siteRoutes from './routes/site'

ensureSchema()

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', authRoutes)
app.route('/api', projectRoutes)
// Public SSR site — catch-all, registered last so /api wins.
app.route('/', siteRoutes)

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Superbird API listening on http://localhost:${info.port}`)
})
