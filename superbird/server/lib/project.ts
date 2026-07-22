import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects, projectState } from '../db/schema'
import type { Project, ProjectDocument, ProjectDesign } from '../../shared/types'

/** The single installed project, or null. (One project per install for now.) */
export function getInstalledProject(): Project | null {
  return db.select().from(projects).limit(1).get() ?? null
}

function stateRow(projectId: string) {
  return db.select().from(projectState).where(eq(projectState.projectId, projectId)).get()
}

/** The working project document (design + content), or null if never saved. */
export function getWorkingDocument(projectId: string): ProjectDocument | null {
  const row = stateRow(projectId)
  if (!row) return null
  return JSON.parse(row.document) as ProjectDocument
}

/** The published design snapshot, or null if never published. */
export function getPublishedDesign(projectId: string): ProjectDesign | null {
  const row = stateRow(projectId)
  if (!row?.publishedDesign) return null
  return JSON.parse(row.publishedDesign) as ProjectDesign
}

export function getPublishedAt(projectId: string): string | null {
  return stateRow(projectId)?.publishedAt ?? null
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
  return now
}
