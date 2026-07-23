import { resolve, basename } from 'node:path'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { backups, media, mediaFolders, submissions, products, orders, orderItems, customers } from '../db/schema'
import { getWorkingDocument, setWorkingDocument } from './project'
import { MEDIA_DIR } from './media'
import { FONTS_DIR } from './fonts'
import { randomId } from './ids'
import type { BackupMeta, ProjectDocument } from '../../shared/types'

// ── Snapshots (lightweight, document only) ──

export function createBackup(projectId: string, label: string, kind: 'manual' | 'auto'): BackupMeta {
  const doc = getWorkingDocument(projectId)
  const json = JSON.stringify(doc ?? { design: null, content: { collections: [], entries: [] } })
  const row = {
    id: randomId('bak'),
    projectId,
    label: label.trim().slice(0, 120) || 'Backup',
    kind,
    document: json,
    size: Buffer.byteLength(json),
    createdAt: new Date().toISOString(),
  }
  db.insert(backups).values(row).run()
  return { id: row.id, label: row.label, kind, size: row.size, createdAt: row.createdAt }
}

export function listBackups(projectId: string): BackupMeta[] {
  return db
    .select({ id: backups.id, label: backups.label, kind: backups.kind, size: backups.size, createdAt: backups.createdAt })
    .from(backups)
    .where(eq(backups.projectId, projectId))
    .orderBy(desc(backups.createdAt))
    .all()
    .map((r) => ({ ...r, kind: r.kind as 'manual' | 'auto' }))
}

export function restoreBackup(projectId: string, id: string): boolean {
  const row = db.select().from(backups).where(eq(backups.id, id)).get()
  if (!row || row.projectId !== projectId) return false
  createBackup(projectId, 'Before restore', 'auto') // safety net
  setWorkingDocument(projectId, JSON.parse(row.document) as ProjectDocument)
  return true
}

export function deleteBackup(projectId: string, id: string): void {
  const row = db.select().from(backups).where(eq(backups.id, id)).get()
  if (row && row.projectId === projectId) db.delete(backups).where(eq(backups.id, id)).run()
}

// Keep only the newest `keep` auto backups (manual ones are never auto-pruned).
function pruneAuto(projectId: string, keep: number): void {
  const auto = db
    .select({ id: backups.id })
    .from(backups)
    .where(eq(backups.kind, 'auto'))
    .orderBy(desc(backups.createdAt))
    .all()
    .filter(() => true)
  for (const r of auto.slice(keep)) db.delete(backups).where(eq(backups.id, r.id)).run()
}

const AUTO_INTERVAL_MS = 24 * 60 * 60 * 1000

// Called when the working doc is saved. Creates at most one auto backup per
// interval and prunes old ones — so an active project keeps ~a week of dailies.
export function maybeAutoBackup(projectId: string): void {
  const last = db
    .select({ createdAt: backups.createdAt })
    .from(backups)
    .where(eq(backups.kind, 'auto'))
    .orderBy(desc(backups.createdAt))
    .get()
  if (last && Date.now() - new Date(last.createdAt).getTime() < AUTO_INTERVAL_MS) return
  createBackup(projectId, 'Automatic backup', 'auto')
  pruneAuto(projectId, 10)
}

// ── Portable export / import (document + media + fonts) ──

const EXPORT_VERSION = 1

interface FontEntry {
  file: string
  data: string
}
interface MediaEntry {
  row: typeof media.$inferSelect
  data: string
}

// Font files referenced by the document's uploaded font set (skip bundled defaults).
function referencedFontFiles(doc: ProjectDocument | null): string[] {
  const set = new Set<string>()
  const fontSet = (doc?.design as { globalStyles?: { fontSet?: Array<{ faces?: Array<{ url?: string }> }> } } | null)
    ?.globalStyles?.fontSet
  for (const fam of fontSet ?? []) {
    for (const face of fam.faces ?? []) {
      const url = face.url ?? ''
      if (url.startsWith('/fonts/')) set.add(basename(url))
    }
  }
  return [...set]
}

/** Build a self-contained portable backup (JSON string). */
export function buildExport(projectId: string): string {
  const doc = getWorkingDocument(projectId)
  const mediaRows = db.select().from(media).where(eq(media.projectId, projectId)).all()
  const mediaEntries: MediaEntry[] = []
  for (const row of mediaRows) {
    const path = resolve(MEDIA_DIR, row.filename)
    if (!existsSync(path)) continue
    mediaEntries.push({ row, data: readFileSync(path).toString('base64') })
  }
  const folders = db.select().from(mediaFolders).where(eq(mediaFolders.projectId, projectId)).all()
  const submissionRows = db.select().from(submissions).where(eq(submissions.projectId, projectId)).all()
  const productRows = db.select().from(products).where(eq(products.projectId, projectId)).all()
  const customerRows = db.select().from(customers).where(eq(customers.projectId, projectId)).all()
  const orderRows = db.select().from(orders).where(eq(orders.projectId, projectId)).all()
  const orderIds = new Set(orderRows.map((o) => o.id))
  const orderItemRows = db.select().from(orderItems).all().filter((i) => orderIds.has(i.orderId))
  const fonts: FontEntry[] = []
  for (const file of referencedFontFiles(doc)) {
    const path = resolve(FONTS_DIR, basename(file))
    if (existsSync(path)) fonts.push({ file: basename(file), data: readFileSync(path).toString('base64') })
  }
  return JSON.stringify({
    superbird: 'backup',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    document: doc,
    media: mediaEntries,
    mediaFolders: folders,
    submissions: submissionRows,
    products: productRows,
    customers: customerRows,
    orders: orderRows,
    orderItems: orderItemRows,
    fonts,
  })
}

export class ImportError extends Error {}

/** Restore a portable backup into the current project (replaces everything). */
export function applyImport(projectId: string, json: string): void {
  let bundle: {
    superbird?: string
    version?: number
    document?: ProjectDocument
    media?: MediaEntry[]
    mediaFolders?: Array<typeof mediaFolders.$inferSelect>
    submissions?: Array<typeof submissions.$inferSelect>
    products?: Array<typeof products.$inferSelect>
    customers?: Array<typeof customers.$inferSelect>
    orders?: Array<typeof orders.$inferSelect>
    orderItems?: Array<typeof orderItems.$inferSelect>
    fonts?: FontEntry[]
  }
  try {
    bundle = JSON.parse(json)
  } catch {
    throw new ImportError('The file is not valid JSON.')
  }
  if (bundle.superbird !== 'backup' || bundle.version !== EXPORT_VERSION) {
    throw new ImportError('Not a Superbird backup file (or an unsupported version).')
  }
  if (!bundle.document || typeof bundle.document !== 'object' || !('content' in bundle.document)) {
    throw new ImportError('Backup is missing its project document.')
  }

  createBackup(projectId, 'Before import', 'auto') // safety net

  // Replace media: drop existing rows + files, then write the bundle's.
  for (const row of db.select().from(media).where(eq(media.projectId, projectId)).all()) {
    const p = resolve(MEDIA_DIR, row.filename)
    if (existsSync(p)) rmSync(p)
  }
  db.delete(media).where(eq(media.projectId, projectId)).run()
  db.delete(mediaFolders).where(eq(mediaFolders.projectId, projectId)).run()
  db.delete(submissions).where(eq(submissions.projectId, projectId)).run()
  // Store data (Stripe secrets are NOT in the bundle — they stay server-side).
  const existingOrders = db.select().from(orders).where(eq(orders.projectId, projectId)).all()
  for (const o of existingOrders) db.delete(orderItems).where(eq(orderItems.orderId, o.id)).run()
  db.delete(orders).where(eq(orders.projectId, projectId)).run()
  db.delete(products).where(eq(products.projectId, projectId)).run()
  db.delete(customers).where(eq(customers.projectId, projectId)).run()

  for (const m of bundle.media ?? []) {
    const filename = basename(m.row.filename) // block path traversal from a crafted bundle
    if (!filename || filename !== m.row.filename) continue
    writeFileSync(resolve(MEDIA_DIR, filename), Buffer.from(m.data, 'base64'))
    db.insert(media).values({ ...m.row, projectId }).run()
  }
  for (const f of bundle.mediaFolders ?? []) {
    db.insert(mediaFolders).values({ ...f, projectId }).run()
  }
  for (const s of bundle.submissions ?? []) {
    db.insert(submissions).values({ ...s, projectId }).run()
  }
  for (const p of bundle.products ?? []) {
    db.insert(products).values({ ...p, projectId }).run()
  }
  for (const cu of bundle.customers ?? []) {
    db.insert(customers).values({ ...cu, projectId }).run()
  }
  for (const o of bundle.orders ?? []) {
    db.insert(orders).values({ ...o, projectId }).run()
  }
  for (const it of bundle.orderItems ?? []) {
    db.insert(orderItems).values(it).run()
  }
  for (const ft of bundle.fonts ?? []) {
    const file = basename(ft.file)
    if (!file) continue
    writeFileSync(resolve(FONTS_DIR, file), Buffer.from(ft.data, 'base64'))
  }

  setWorkingDocument(projectId, bundle.document)
}
