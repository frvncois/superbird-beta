import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { requireAuth } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import { hit, clientIp } from '../lib/rateLimit'
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  buildExport,
  applyImport,
  ImportError,
} from '../lib/backup'

// All backup/export/import routes require an authenticated admin session, and
// operate ONLY on the single installed project — there is no id in any URL that
// could reference another project, so no one can pull/overwrite someone else's
// backup. Export is streamed to the caller, never written to a public path.
const backup = new Hono()

backup.use('*', requireAuth)

function proj() {
  return getInstalledProject()
}

backup.get('/backups', (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ backups: listBackups(p.id) })
})

backup.post('/backups', async (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  const { label } = ((await c.req.json().catch(() => ({}))) as { label?: string }) ?? {}
  return c.json(createBackup(p.id, label ?? 'Manual backup', 'manual'), 201)
})

backup.post('/backups/:id/restore', (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  const lim = hit(`restore:${clientIp(c)}`, 10, 60_000)
  if (!lim.ok) return c.json({ error: 'Too many attempts. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })
  const ok = restoreBackup(p.id, c.req.param('id'))
  if (!ok) return c.json({ error: 'Backup not found.' }, 404)
  return c.json({ ok: true })
})

backup.delete('/backups/:id', (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  deleteBackup(p.id, c.req.param('id'))
  return c.json({ ok: true })
})

// Portable export — a downloadable .sbbackup (document + media + fonts).
backup.get('/export', (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  const lim = hit(`backup-export:${clientIp(c)}`, 10, 60_000)
  if (!lim.ok) return c.json({ error: 'Too many exports. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })
  const body = buildExport(p.id)
  const stamp = new Date().toISOString().slice(0, 10)
  const name = `${p.handle || 'superbird'}-${stamp}.sbbackup`
  return new Response(body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  })
})

// Portable import — replaces the current project with an uploaded backup.
// Larger body limit than the global cap (backups bundle media).
backup.post('/import', bodyLimit({ maxSize: 256 * 1024 * 1024, onError: (c) => c.json({ error: 'Backup too large (max 256 MB).' }, 413) }), async (c) => {
  const p = proj()
  if (!p) return c.json({ error: 'Not installed.' }, 409)
  const lim = hit(`import:${clientIp(c)}`, 5, 60_000)
  if (!lim.ok) return c.json({ error: 'Too many imports. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })
  const json = await c.req.text()
  try {
    applyImport(p.id, json)
    return c.json({ ok: true })
  } catch (e) {
    if (e instanceof ImportError) return c.json({ error: e.message }, 400)
    throw e
  }
})

export default backup
