import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import type { FontFaceDTO } from '../../shared/types'
import { randomHex } from './ids'

const here = dirname(fileURLToPath(import.meta.url))
// Uploaded fonts (git-ignored, per project).
const FONTS_DIR = process.env.SUPERBIRD_FONTS ?? resolve(here, '../../data/fonts')
// Bundled "default" fonts shipped with the app (committed).
const DEFAULTS_DIR = resolve(here, '../assets/fonts')
mkdirSync(FONTS_DIR, { recursive: true })

const MIME_BY_EXT: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
}
const FORMAT_BY_EXT: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

/** Persist uploaded font bytes and return the filename + public url. */
export function saveFontFile(bytes: Buffer, ext: string): { file: string; url: string } {
  const clean = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'woff2'
  const file = `${randomHex()}.${clean}`
  writeFileSync(resolve(FONTS_DIR, file), bytes)
  return { file, url: `/fonts/${file}` }
}

/**
 * Read a font file for the public /fonts/:file route. Uploaded fonts win; falls
 * back to the bundled defaults dir so default fonts serve too. Guards traversal.
 */
export function readFontFile(file: string): { bytes: Buffer; mime: string } | null {
  const safe = basename(file)
  const ext = safe.slice(safe.lastIndexOf('.') + 1).toLowerCase()
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream'
  const uploaded = resolve(FONTS_DIR, safe)
  if (existsSync(uploaded)) return { bytes: readFileSync(uploaded), mime }
  const bundled = resolve(DEFAULTS_DIR, safe)
  if (existsSync(bundled)) return { bytes: readFileSync(bundled), mime }
  return null
}

/** Delete self-hosted upload files for a family (when a font is removed). */
export function deleteFontFiles(urls: string[]): void {
  for (const url of urls) {
    const path = resolve(FONTS_DIR, basename(url))
    if (existsSync(path)) rmSync(path)
  }
}

const ALLOWED_FONT_EXT = new Set(['woff2', 'woff', 'ttf', 'otf'])

// Sniff the file signature so an arbitrary blob can't be written to the fonts
// dir (and later served). Covers woff2/woff/otf/ttf/ttc.
function looksLikeFont(bytes: Buffer): boolean {
  if (bytes.length < 4) return false
  const tag = bytes.subarray(0, 4).toString('latin1')
  if (tag === 'wOF2' || tag === 'wOFF' || tag === 'OTTO' || tag === 'true' || tag === 'ttcf') return true
  // TrueType sfnt version 0x00010000
  return bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00
}

/** Save one uploaded custom face (weight/style) and return its DTO. */
export function saveCustomFace(
  bytes: Buffer,
  filename: string,
  weight: string,
  style: 'normal' | 'italic',
): FontFaceDTO {
  const ext = (filename.slice(filename.lastIndexOf('.') + 1) || '').toLowerCase()
  if (!ALLOWED_FONT_EXT.has(ext)) throw new Error('Unsupported font type. Use .woff2, .woff, .ttf or .otf.')
  if (!looksLikeFont(bytes)) throw new Error('That file is not a valid font.')
  const { url } = saveFontFile(bytes, ext)
  return { weight, style, url, format: FORMAT_BY_EXT[ext] ?? 'woff2' }
}
