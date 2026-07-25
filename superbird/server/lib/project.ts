import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects, projectState } from '../db/schema'
import type { Project, ProjectDocument, ProjectDesign } from '../../shared/types'

/** The single installed project, or null. (One project per install for now.) */
export function getInstalledProject(): Project | null {
  return db.select().from(projects).limit(1).get() ?? null
}

// The `document` and `published_design` TEXT columns are multi-MB. The public
// site reads them on every request (page + /style.css + /script.js), and the
// form/media/admin paths re-read the working doc — so parsing (and even letting
// SQLite materialise the big TEXT into a JS string) per request caps throughput
// at a few req/s. Cache the parsed value keyed on the row's updatedAt/publishedAt
// timestamp: this single process owns every write, so the timestamp is a
// sufficient version tag. On a cache hit we read only the tiny timestamp column,
// skipping both the big-column read and the JSON.parse.
let workingCache: { key: string; doc: ProjectDocument } | null = null
let publishedCache: { key: string; design: ProjectDesign } | null = null

/** The working project document (design + content), or null if never saved. */
export function getWorkingDocument(projectId: string): ProjectDocument | null {
  const stamp = db.select({ updatedAt: projectState.updatedAt }).from(projectState).where(eq(projectState.projectId, projectId)).get()
  if (!stamp) return null
  const key = `${projectId}:${stamp.updatedAt}`
  if (workingCache?.key === key) return workingCache.doc
  const row = db.select({ document: projectState.document }).from(projectState).where(eq(projectState.projectId, projectId)).get()
  if (!row) return null
  const doc = JSON.parse(row.document) as ProjectDocument
  workingCache = { key, doc }
  return doc
}

/**
 * The configured public deployment origin (e.g. `https://example.com`), or null
 * when unset/malformed. Reuses the working-document cache, so this is a cheap
 * timestamp read on the hot path. Used by the admin origin guard.
 */
export function getDeploymentOrigin(projectId: string): string | null {
  const doc = getWorkingDocument(projectId)
  const url = (doc?.design as { siteSettings?: { deployment?: { url?: string } } } | null)
    ?.siteSettings?.deployment?.url?.trim()
  if (!url) return null
  try {
    return new URL(/:\/\//.test(url) ? url : `https://${url}`).origin
  } catch {
    return null
  }
}

/**
 * Overwrite the working document (autosave + headless MCP editor). Callers must
 * not mutate `doc` after this returns — it becomes the shared cached object.
 */
export function setWorkingDocument(projectId: string, doc: ProjectDocument): void {
  const now = new Date().toISOString()
  const json = JSON.stringify(doc)
  const exists = db.select({ projectId: projectState.projectId }).from(projectState).where(eq(projectState.projectId, projectId)).get()
  if (exists) {
    db.update(projectState).set({ document: json, updatedAt: now }).where(eq(projectState.projectId, projectId)).run()
  } else {
    db.insert(projectState).values({ projectId, document: json, updatedAt: now }).run()
  }
  // Keep the cache coherent with what we just persisted.
  workingCache = { key: `${projectId}:${now}`, doc }
}

/** The published design snapshot, or null if never published. */
export function getPublishedDesign(projectId: string): ProjectDesign | null {
  const stamp = db.select({ publishedAt: projectState.publishedAt }).from(projectState).where(eq(projectState.projectId, projectId)).get()
  if (!stamp?.publishedAt) return null
  const key = `${projectId}:${stamp.publishedAt}`
  if (publishedCache?.key === key) return publishedCache.design
  const row = db.select({ publishedDesign: projectState.publishedDesign }).from(projectState).where(eq(projectState.projectId, projectId)).get()
  if (!row?.publishedDesign) return null
  const design = JSON.parse(row.publishedDesign) as ProjectDesign
  publishedCache = { key, design }
  return design
}

export function getPublishedAt(projectId: string): string | null {
  return db.select({ publishedAt: projectState.publishedAt }).from(projectState).where(eq(projectState.projectId, projectId)).get()?.publishedAt ?? null
}

/** Snapshot the working design into the published slot. Returns publishedAt. */
export function publishDesign(projectId: string): string | null {
  const doc = getWorkingDocument(projectId)
  if (!doc?.design) return null
  const now = new Date().toISOString()
  db.update(projectState)
    .set({ publishedDesign: JSON.stringify(doc.design), publishedAt: now })
    .where(eq(projectState.projectId, projectId))
    .run()
  // Invalidate; the next read re-parses the freshly published snapshot.
  publishedCache = null
  return now
}
