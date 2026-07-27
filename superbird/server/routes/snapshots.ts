import { Hono, type Context } from 'hono'
import { requireAuth, currentUser } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import { hit, clientIp } from '../lib/rateLimit'
import {
  listSnapshots,
  getSnapshot,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  setSnapshotMeta,
  type SnapshotAuthor,
} from '../lib/snapshots'
import type { SnapshotCreateInput, SnapshotReason } from '../../shared/types'

const snapshots = new Hono()

// Editor-only version history: logged-in users only.
snapshots.use('*', requireAuth)

const REASONS: SnapshotReason[] = ['open', 'publish', 'auto', 'manual', 'mcp-before', 'mcp-after']
const DEFAULT_LABELS: Record<SnapshotReason, string> = {
  open: 'Opened editor',
  publish: 'Published',
  auto: 'Auto-saved',
  manual: 'Manual snapshot',
  'mcp-before': 'Before AI edits',
  'mcp-after': 'After AI edits',
}

function author(c: Context): SnapshotAuthor {
  const u = currentUser(c)
  return { id: u?.id ?? 'unknown', name: u?.name ?? 'Unknown' }
}

snapshots.get('/snapshots', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ items: listSnapshots(proj.id) })
})

snapshots.post('/snapshots', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json().catch(() => ({}))) as SnapshotCreateInput
  const reason: SnapshotReason = REASONS.includes(body.reason as SnapshotReason) ? body.reason! : 'manual'
  const label = body.label?.trim() || DEFAULT_LABELS[reason]
  return c.json(createSnapshot(proj.id, { reason, label, author: author(c) }), 201)
})

snapshots.get('/snapshots/:id', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const detail = getSnapshot(proj.id, c.req.param('id'))
  if (!detail) return c.json({ error: 'Snapshot not found.' }, 404)
  return c.json(detail)
})

snapshots.post('/snapshots/:id/restore', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const limit = hit(`snapshot-restore:${clientIp(c)}`, 20, 60_000)
  if (!limit.ok) return c.json({ error: 'Too many restores. Try again shortly.' }, 429, { 'Retry-After': String(limit.retryAfter) })
  if (!restoreSnapshot(proj.id, c.req.param('id'), author(c))) return c.json({ error: 'Snapshot not found.' }, 404)
  return c.json({ ok: true })
})

snapshots.patch('/snapshots/:id', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json().catch(() => ({}))) as { pinned?: boolean; label?: string }
  const patch: { pinned?: boolean; label?: string } = {}
  if (typeof body.pinned === 'boolean') patch.pinned = body.pinned
  if (typeof body.label === 'string' && body.label.trim()) patch.label = body.label.trim()
  const updated = setSnapshotMeta(proj.id, c.req.param('id'), patch)
  if (!updated) return c.json({ error: 'Snapshot not found.' }, 404)
  return c.json(updated)
})

snapshots.delete('/snapshots/:id', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  if (!deleteSnapshot(proj.id, c.req.param('id'))) return c.json({ error: 'Snapshot not found.' }, 404)
  return c.json({ ok: true })
})

export default snapshots
