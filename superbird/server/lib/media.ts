import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { media, mediaFolders } from '../db/schema'
import { getWorkingDocument } from './project'

const here = dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = process.env.SUPERBIRD_MEDIA ?? resolve(here, '../../data/media')
mkdirSync(MEDIA_DIR, { recursive: true })

// Client-facing shape (matches the client's MediaItem / MediaFolder).
export interface MediaItemDTO {
  id: string
  name: string
  url: string
  type: string
  mimeType: string
  size: number
  width?: number
  height?: number
  folderId?: string
  alt?: string
  tags: string[]
  createdAt: string
}
export interface MediaFolderDTO {
  id: string
  name: string
  parentId?: string
}

export function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

// ── Image compression ──
export interface CompressionSettings {
  enabled: boolean
  maxWidth: number
  maxHeight: number
  quality: number
}
export const DEFAULT_COMPRESSION: CompressionSettings = {
  enabled: true,
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 90,
}

// Raster images only — never SVG (vector) or GIF (would lose animation).
function shouldCompress(mime: string): boolean {
  return mime.startsWith('image/') && mime !== 'image/svg+xml' && mime !== 'image/gif'
}

/** Read the project's compression settings from its working document. */
export function getCompressionSettings(projectId: string): CompressionSettings {
  const doc = getWorkingDocument(projectId)
  const design = doc?.design as { siteSettings?: { imageCompression?: Partial<CompressionSettings> } } | null
  const s = design?.siteSettings?.imageCompression
  if (!s || typeof s.enabled !== 'boolean') return DEFAULT_COMPRESSION
  return {
    enabled: s.enabled,
    maxWidth: Number(s.maxWidth) || DEFAULT_COMPRESSION.maxWidth,
    maxHeight: Number(s.maxHeight) || DEFAULT_COMPRESSION.maxHeight,
    quality: Math.min(100, Math.max(1, Number(s.quality) || DEFAULT_COMPRESSION.quality)),
  }
}

async function compressToWebp(
  bytes: Buffer,
  opts: CompressionSettings,
): Promise<{ bytes: Buffer; width?: number; height?: number }> {
  const out = await sharp(bytes)
    .rotate() // honor EXIF orientation before stripping metadata
    .resize(opts.maxWidth, opts.maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: opts.quality })
    .toBuffer({ resolveWithObject: true })
  return { bytes: out.data, width: out.info.width, height: out.info.height }
}

function typeFromMime(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return 'document'
  return 'other'
}

function extFromName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot) : ''
}

type MediaRow = typeof media.$inferSelect

function rowToItem(row: MediaRow): MediaItemDTO {
  return {
    id: row.id,
    name: row.name,
    url: `/media/${row.id}`,
    type: row.type,
    mimeType: row.mime,
    size: row.size,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    folderId: row.folderId ?? undefined,
    alt: row.alt ?? undefined,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.createdAt,
  }
}

export function listMedia(projectId: string): { items: MediaItemDTO[]; folders: MediaFolderDTO[] } {
  const items = db.select().from(media).where(eq(media.projectId, projectId)).all().map(rowToItem)
  const folders = db
    .select()
    .from(mediaFolders)
    .where(eq(mediaFolders.projectId, projectId))
    .all()
    .map((f) => ({ id: f.id, name: f.name, parentId: f.parentId ?? undefined }))
  return { items, folders }
}

export async function createMedia(
  projectId: string,
  input: { name: string; mime: string; size: number; width?: number; height?: number; folderId?: string; bytes: Buffer },
  compression: CompressionSettings = DEFAULT_COMPRESSION,
): Promise<MediaItemDTO> {
  let { name, mime, size, width, height, bytes } = input

  // Convert raster images to compressed WebP (falls back to the original on error).
  if (compression.enabled && shouldCompress(mime)) {
    try {
      const c = await compressToWebp(bytes, compression)
      bytes = c.bytes
      mime = 'image/webp'
      name = name.replace(/\.[^.]+$/, '') + '.webp'
      width = c.width
      height = c.height
      size = bytes.length
    } catch {
      // keep the original bytes/metadata
    }
  }

  const id = randomId('media')
  const filename = `${id}${extFromName(name)}`
  writeFileSync(resolve(MEDIA_DIR, filename), bytes)
  const now = new Date().toISOString()
  db.insert(media)
    .values({
      id,
      projectId,
      name,
      filename,
      mime,
      type: typeFromMime(mime),
      size,
      width: width ?? null,
      height: height ?? null,
      folderId: input.folderId ?? null,
      alt: null,
      tags: '[]',
      createdAt: now,
    })
    .run()
  return rowToItem(db.select().from(media).where(eq(media.id, id)).get()!)
}

export function updateMedia(
  id: string,
  patch: { name?: string; alt?: string; tags?: string[]; folderId?: string | null },
): MediaItemDTO | null {
  const set: Partial<MediaRow> = {}
  if (patch.name !== undefined) set.name = patch.name
  if (patch.alt !== undefined) set.alt = patch.alt
  if (patch.tags !== undefined) set.tags = JSON.stringify(patch.tags)
  if (patch.folderId !== undefined) set.folderId = patch.folderId
  if (Object.keys(set).length) db.update(media).set(set).where(eq(media.id, id)).run()
  const row = db.select().from(media).where(eq(media.id, id)).get()
  return row ? rowToItem(row) : null
}

export function deleteMedia(id: string): void {
  const row = db.select().from(media).where(eq(media.id, id)).get()
  if (!row) return
  const path = resolve(MEDIA_DIR, row.filename)
  if (existsSync(path)) rmSync(path)
  db.delete(media).where(eq(media.id, id)).run()
}

/** Read a stored file for serving. Returns bytes + mime, or null. */
export function readMediaFile(id: string): { bytes: Buffer; mime: string } | null {
  const row = db.select().from(media).where(eq(media.id, id)).get()
  if (!row) return null
  const path = resolve(MEDIA_DIR, row.filename)
  if (!existsSync(path)) return null
  return { bytes: readFileSync(path), mime: row.mime }
}

// ── Folders ──
export function createFolder(projectId: string, name: string, parentId?: string): MediaFolderDTO {
  const id = randomId('folder')
  db.insert(mediaFolders).values({ id, projectId, name, parentId: parentId ?? null }).run()
  return { id, name, parentId }
}

export function renameFolder(id: string, name: string): void {
  db.update(mediaFolders).set({ name }).where(eq(mediaFolders.id, id)).run()
}

export function deleteFolder(id: string): void {
  // Unassign items in this folder, then remove child folders, then the folder.
  db.update(media).set({ folderId: null }).where(eq(media.folderId, id)).run()
  const children = db.select().from(mediaFolders).where(eq(mediaFolders.parentId, id)).all()
  for (const child of children) deleteFolder(child.id)
  db.delete(mediaFolders).where(eq(mediaFolders.id, id)).run()
}
