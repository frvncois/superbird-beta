import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ensureSchema } from './db/client'
import authRoutes from './routes/auth'

ensureSchema()

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', authRoutes)

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Superbird API listening on http://localhost:${info.port}`)
})
