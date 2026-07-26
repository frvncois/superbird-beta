import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { ensureSchema } from './db/client'
import authRoutes from './routes/auth'
import twoFactorRoutes from './routes/twoFactor'
import projectRoutes from './routes/project'
import mediaRoutes from './routes/media'
import fontsRoutes from './routes/fonts'
import usersRoutes from './routes/users'
import mcpRoutes from './routes/mcp'
import backupRoutes from './routes/backup'
import publicFormsRoutes from './routes/publicForms'
import formsRoutes from './routes/forms'
import siteRoutes from './routes/site'
import { readMediaFile } from './lib/media'
import { readFontFile } from './lib/fonts'
import { currentUser } from './lib/session'
import { originGuard } from './lib/originGuard'
import { hit, clientIp } from './lib/rateLimit'

ensureSchema()

// Exported for integration tests (drive via app.fetch); `serve()` below still
// starts the real listener when this module is the process entry.
export const app = new Hono()

// Normalize errors — never leak stack traces / internals to the client.
app.onError((err, c) => {
  console.error('[superbird] unhandled error:', err)
  return c.json({ error: 'Internal server error.' }, 500)
})

// Security headers on every response: clickjacking (X-Frame-Options), MIME
// sniffing (nosniff), referrer + HSTS. No global CSP (would break published
// sites and the admin SPA); resource-isolation headers are left off so the
// published site can load its own /media and /fonts.
app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'SAMEORIGIN',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    strictTransportSecurity: 'max-age=63072000; includeSubDomains',
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: undefined,
  }),
)

// Cap request bodies (uploads + the project document) to prevent OOM DoS.
// /api/import is exempt — it has its own (larger) limit since backups bundle media.
const globalBodyLimit = bodyLimit({ maxSize: 30 * 1024 * 1024, onError: (c) => c.json({ error: 'Payload too large (max 30 MB).' }, 413) })
app.use('*', (c, next) => (c.req.path === '/api/import' ? next() : globalBodyLimit(c, next)))

// Generic per-IP ceiling on the whole API — a DoS/abuse backstop set well above
// normal admin usage (autosave, boot fan-out). Targeted limits on sensitive
// endpoints (login, install, import/restore, user mgmt) are tighter.
app.use('/api/*', async (c, next) => {
  const lim = hit(`api:${clientIp(c)}`, 1000, 60_000)
  if (!lim.ok) return c.json({ error: 'Too many requests.' }, 429, { 'Retry-After': String(lim.retryAfter) })
  await next()
})

// Trusted-origin guard: rejects state-changing admin (session-bearing) requests
// from an origin outside the allowlist (own origin + configured deployment URL +
// dev localhost). No-op for public/webhook/MCP-token/login traffic. See file.
app.use('/api/*', originGuard)

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api', authRoutes)
app.route('/api', twoFactorRoutes)
// Public form submissions (no session — visitors post here). Registered before
// the session-guarded routers so their `/api/*` guards don't intercept it.
app.route('/api', publicFormsRoutes)
// MCP bridge (no session — a local developer bridge). Registered before the
// session-guarded routers so their `/api/*` guards don't intercept it.
app.route('/api', mcpRoutes)
app.route('/api', projectRoutes)
app.route('/api', mediaRoutes)
app.route('/api', fontsRoutes)
app.route('/api', usersRoutes)
app.route('/api', backupRoutes)
app.route('/api', formsRoutes)

// Document types that would execute as HTML if navigated to — force download.
const DANGEROUS_MIME = new Set(['text/html', 'application/xhtml+xml', 'text/xml', 'application/xml'])

// Public media files (no auth — referenced by published pages). Served with
// nosniff + CSP sandbox so a malicious upload (e.g. an SVG or HTML with script)
// can't execute in the same origin as the admin/API.
app.get('/media/:id', (c) => {
  const file = readMediaFile(c.req.param('id'))
  if (!file) return c.notFound()
  // Private media (flagged, or inside a private folder) is admin-only: hide its
  // existence from anonymous callers (404, not 403) and never cache it publicly.
  if (file.private && !currentUser(c)) return c.notFound()
  const dangerous = DANGEROUS_MIME.has(file.mime)
  const headers: Record<string, string> = {
    'Content-Type': dangerous ? 'application/octet-stream' : file.mime,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    'Cache-Control': file.private ? 'private, no-store' : 'public, max-age=31536000, immutable',
  }
  if (dangerous) headers['Content-Disposition'] = 'attachment'
  return new Response(file.bytes, { headers })
})

// Public font files (no auth — referenced by @font-face in published pages).
app.get('/fonts/:file', (c) => {
  const file = readFontFile(c.req.param('file'))
  if (!file) return c.notFound()
  return new Response(file.bytes, {
    headers: {
      'Content-Type': file.mime,
      'X-Content-Type-Options': 'nosniff',
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
