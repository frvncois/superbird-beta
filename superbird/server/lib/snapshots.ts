import { createHash } from 'node:crypto'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { snapshots } from '../db/schema'
import { randomId } from './ids'
import { getWorkingDocument, setWorkingDocument } from './project'
import type { ProjectDocument, Snapshot, SnapshotDetail, SnapshotReason } from '../../shared/types'

// Version history of the working document. Snapshots are deduped by a content
// hash (skip an identical-to-latest one) and pruned by a smart cap so the list
// never balloons. All queries are scoped by projectId (single-project model).

const EMPTY: ProjectDocument = { design: null, content: { collections: [], entries: [] } }
const KEEP_PRUNABLE = 15 // newest auto/open/mcp snapshots to keep
const HARD_CAP = 50 // absolute backstop across all reasons
const PROTECTED_REASONS: SnapshotReason[] = ['manual', 'publish']

type Row = typeof snapshots.$inferSelect

export interface SnapshotAuthor {
  id: string
  name: string
}

function toMeta(row: Row): Snapshot {
  return {
    id: row.id,
    reason: row.reason as SnapshotReason,
    label: row.label,
    authorName: row.authorName,
    size: row.size,
    pinned: row.pinned === 1,
    createdAt: row.createdAt,
  }
}

// Exact JSON string that gets stored (matches backup.ts's fallback), so the hash
// is stable and comparable across snapshots.
function currentJson(projectId: string): string {
  return JSON.stringify(getWorkingDocument(projectId) ?? EMPTY)
}
function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

export function listSnapshots(projectId: string): Snapshot[] {
  return db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.createdAt))
    .all()
    .map(toMeta)
}

export function getSnapshot(projectId: string, id: string): SnapshotDetail | null {
  const row = db.select().from(snapshots).where(and(eq(snapshots.projectId, projectId), eq(snapshots.id, id))).get()
  if (!row) return null
  return { ...toMeta(row), document: JSON.parse(row.document) as ProjectDocument }
}

export function createSnapshot(
  projectId: string,
  opts: { reason: SnapshotReason; label: string; author: SnapshotAuthor; force?: boolean },
): { snapshot: Snapshot; deduped: boolean } {
  const json = currentJson(projectId)
  const hash = sha256(json)
  const latest = db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.createdAt))
    .limit(1)
    .get()
  // Skip when the working document is unchanged since the last snapshot.
  if (!opts.force && latest && latest.hash === hash) {
    return { snapshot: toMeta(latest), deduped: true }
  }
  const id = randomId('snap')
  db.insert(snapshots)
    .values({
      id,
      projectId,
      reason: opts.reason,
      label: opts.label,
      document: json,
      hash,
      authorId: opts.author.id,
      authorName: opts.author.name,
      size: Buffer.byteLength(json),
      pinned: 0,
      createdAt: new Date().toISOString(),
    })
    .run()
  pruneSnapshots(projectId)
  return { snapshot: toMeta(db.select().from(snapshots).where(eq(snapshots.id, id)).get()!), deduped: false }
}

export function setSnapshotMeta(
  projectId: string,
  id: string,
  patch: { pinned?: boolean; label?: string },
): Snapshot | null {
  const row = db.select().from(snapshots).where(and(eq(snapshots.projectId, projectId), eq(snapshots.id, id))).get()
  if (!row) return null
  const set: Partial<Row> = {}
  if (patch.pinned !== undefined) set.pinned = patch.pinned ? 1 : 0
  if (patch.label !== undefined) set.label = patch.label
  if (Object.keys(set).length) db.update(snapshots).set(set).where(eq(snapshots.id, id)).run()
  return toMeta(db.select().from(snapshots).where(eq(snapshots.id, id)).get()!)
}

export function deleteSnapshot(projectId: string, id: string): boolean {
  return db.delete(snapshots).where(and(eq(snapshots.projectId, projectId), eq(snapshots.id, id))).run().changes > 0
}

export function restoreSnapshot(projectId: string, id: string, author: SnapshotAuthor): boolean {
  const row = db.select().from(snapshots).where(and(eq(snapshots.projectId, projectId), eq(snapshots.id, id))).get()
  if (!row) return false
  // Safety net: capture the current state before overwriting (deduped if identical).
  createSnapshot(projectId, { reason: 'auto', label: 'Before restore', author })
  setWorkingDocument(projectId, JSON.parse(row.document) as ProjectDocument)
  return true
}

// Smart cap: pinned + manual/publish snapshots are never auto-pruned. Of the rest
// (open/auto/mcp-*), keep only the newest KEEP_PRUNABLE. A HARD_CAP backstop then
// trims the oldest non-pinned rows if the total is still over.
export function pruneSnapshots(projectId: string): void {
  const rows = db
    .select()
    .from(snapshots)
    .where(eq(snapshots.projectId, projectId))
    .orderBy(desc(snapshots.createdAt))
    .all()

  const isProtected = (r: Row) => r.pinned === 1 || PROTECTED_REASONS.includes(r.reason as SnapshotReason)
  const doomed = new Set<string>()

  let prunableSeen = 0
  for (const r of rows) {
    if (isProtected(r)) continue
    prunableSeen++
    if (prunableSeen > KEEP_PRUNABLE) doomed.add(r.id)
  }

  const remaining = rows.filter((r) => !doomed.has(r.id))
  let over = remaining.length - HARD_CAP
  for (let i = remaining.length - 1; i >= 0 && over > 0; i--) {
    const r = remaining[i]!
    if (r.pinned === 1) continue
    doomed.add(r.id)
    over--
  }

  for (const id of doomed) db.delete(snapshots).where(eq(snapshots.id, id)).run()
}
