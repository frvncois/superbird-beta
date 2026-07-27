import { resolve, basename } from 'node:path'
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, renameSync } from 'node:fs'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { backups, media, mediaFolders, submissions } from '../db/schema'
import { getWorkingDocument, setWorkingDocument } from './project'
import { MEDIA_DIR } from './media'
import { FONTS_DIR, looksLikeFont } from './fonts'
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

// Keep only the newest `keep` auto backups for this project (manual ones are
// never auto-pruned).
function pruneAuto(projectId: string, keep: number): void {
  const auto = db
    .select({ id: backups.id })
    .from(backups)
    .where(and(eq(backups.projectId, projectId), eq(backups.kind, 'auto')))
    .orderBy(desc(backups.createdAt))
    .all()
  for (const r of auto.slice(keep)) db.delete(backups).where(eq(backups.id, r.id)).run()
}

const AUTO_INTERVAL_MS = 24 * 60 * 60 * 1000

// Called when the working doc is saved. Creates at most one auto backup per
// interval and prunes old ones — so an active project keeps ~a week of dailies.
export function maybeAutoBackup(projectId: string): void {
  const last = db
    .select({ createdAt: backups.createdAt })
    .from(backups)
    .where(and(eq(backups.projectId, projectId), eq(backups.kind, 'auto')))
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
    fonts,
  })
}

export class ImportError extends Error {}

// Cap a single bundled media file so one huge base64 entry can't exhaust memory
// (the 256 MB body limit bounds the whole bundle, not each file).
const MAX_IMPORT_MEDIA_BYTES = 50 * 1024 * 1024

/**
 * Restore a portable backup into the current project (replaces everything).
 * Failure-safe: nothing existing is deleted until (a) a full, recoverable safety
 * backup — document + media + submissions + fonts — is written to disk and (b)
 * every incoming media file is decoded and written to a staging dir. The row
 * swap runs in a single DB transaction (all-or-nothing), and only then are the
 * old files removed and the staged ones moved in. A throw at any point before
 * the commit leaves the project untouched; a throw after is recoverable from the
 * on-disk safety backup.
 */
export function applyImport(projectId: string, json: string): void {
  let bundle: {
    superbird?: string
    version?: number
    document?: ProjectDocument
    media?: MediaEntry[]
    mediaFolders?: Array<typeof mediaFolders.$inferSelect>
    submissions?: Array<typeof submissions.$inferSelect>
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
  const document = bundle.document

  // 1) Recoverable safety net BEFORE any destruction: a full portable backup
  //    (document + media + submissions + fonts) written to disk, plus the
  //    lightweight document snapshot for the Backup UI. If the import fails
  //    later, the operator re-imports this file.
  try {
    writeFileSync(resolve(MEDIA_DIR, '..', 'pre-import-backup.sbbackup'), buildExport(projectId))
  } catch {
    throw new ImportError('Could not write the pre-import safety backup — import aborted.')
  }
  createBackup(projectId, 'Before import', 'auto')

  // 2) Stage all incoming media into a temp dir (validate name + size). Nothing
  //    existing is touched; any failure just discards the staging dir.
  const staging = resolve(MEDIA_DIR, '..', `.import-staging-${randomId('imp')}`)
  const staged: Array<{ tmp: string; filename: string; row: typeof media.$inferSelect }> = []
  try {
    mkdirSync(staging, { recursive: true })
    for (const m of bundle.media ?? []) {
      const filename = basename(m.row.filename) // block path traversal from a crafted bundle
      if (!filename || filename !== m.row.filename) continue
      if ((m.data.length * 3) / 4 > MAX_IMPORT_MEDIA_BYTES) {
        throw new ImportError(`A media file in the backup exceeds the ${MAX_IMPORT_MEDIA_BYTES / 1024 / 1024} MB per-file limit.`)
      }
      const tmp = resolve(staging, filename)
      writeFileSync(tmp, Buffer.from(m.data, 'base64'))
      staged.push({ tmp, filename, row: m.row })
    }
  } catch (e) {
    rmSync(staging, { recursive: true, force: true })
    throw e instanceof ImportError ? e : new ImportError('Failed to read media from the backup.')
  }

  // 3) Swap the rows atomically — rolls back on any error, leaving rows intact.
  const oldFiles = db
    .select({ filename: media.filename })
    .from(media)
    .where(eq(media.projectId, projectId))
    .all()
    .map((r) => r.filename)
  try {
    db.transaction((tx) => {
      tx.delete(media).where(eq(media.projectId, projectId)).run()
      tx.delete(mediaFolders).where(eq(mediaFolders.projectId, projectId)).run()
      tx.delete(submissions).where(eq(submissions.projectId, projectId)).run()
      for (const s of staged) tx.insert(media).values({ ...s.row, projectId }).run()
      for (const f of bundle.mediaFolders ?? []) tx.insert(mediaFolders).values({ ...f, projectId }).run()
      for (const s of bundle.submissions ?? []) tx.insert(submissions).values({ ...s, projectId }).run()
    })
  } catch {
    rmSync(staging, { recursive: true, force: true })
    throw new ImportError('Failed to apply the backup — no changes were made.')
  }
  // Kept out of the transaction: setWorkingDocument mutates a module cache that a
  // rollback wouldn't revert. Recoverable from the safety backup if it throws.
  setWorkingDocument(projectId, document)

  // 4) Rows committed → replace files. Remove the old media, move staged in.
  for (const fn of oldFiles) {
    const p = resolve(MEDIA_DIR, fn)
    try {
      if (existsSync(p)) rmSync(p)
    } catch {
      /* best effort */
    }
  }
  for (const s of staged) {
    const dest = resolve(MEDIA_DIR, s.filename)
    try {
      renameSync(s.tmp, dest)
    } catch {
      // cross-device or race → fall back to copy.
      try {
        writeFileSync(dest, readFileSync(s.tmp))
      } catch {
        /* best effort */
      }
    }
  }
  rmSync(staging, { recursive: true, force: true })

  // 5) Fonts are additive (existing fonts aren't deleted), so write them last.
  //    Magic-byte validate like the upload path — a crafted bundle can't plant an
  //    arbitrary blob in the fonts dir.
  for (const ft of bundle.fonts ?? []) {
    const file = basename(ft.file)
    if (!file) continue
    try {
      const bytes = Buffer.from(ft.data, 'base64')
      if (!looksLikeFont(bytes)) continue
      writeFileSync(resolve(FONTS_DIR, file), bytes)
    } catch {
      /* best effort */
    }
  }
}
