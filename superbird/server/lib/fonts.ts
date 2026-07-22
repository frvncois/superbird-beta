import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import type {
  FontCatalogEntry,
  FontFaceDTO,
  FontFamilyDTO,
  FontImportPayload,
} from '../../shared/types'
import { getWorkingDocument, getInstalledProject } from './project'

const here = dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = process.env.SUPERBIRD_FONTS ?? resolve(here, '../../data/fonts')
mkdirSync(FONTS_DIR, { recursive: true })

// A modern browser UA so Google returns woff2 (old UAs get ttf).
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

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

function randomId(): string {
  return randomBytes(8).toString('hex')
}

// ── Disk ──

/** Persist font bytes and return the id (used as the filename) + public url. */
export function saveFontFile(bytes: Buffer, ext: string): { file: string; url: string } {
  const clean = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'woff2'
  const file = `${randomId()}.${clean}`
  writeFileSync(resolve(FONTS_DIR, file), bytes)
  return { file, url: `/fonts/${file}` }
}

/** Read a font file for the public /fonts/:file route. Guards path traversal. */
export function readFontFile(file: string): { bytes: Buffer; mime: string } | null {
  const safe = basename(file)
  const path = resolve(FONTS_DIR, safe)
  if (!existsSync(path)) return null
  const ext = safe.slice(safe.lastIndexOf('.') + 1).toLowerCase()
  return { bytes: readFileSync(path), mime: MIME_BY_EXT[ext] ?? 'application/octet-stream' }
}

/** Delete self-hosted files for a family (called when a font is removed). */
export function deleteFontFiles(urls: string[]): void {
  for (const url of urls) {
    const file = basename(url)
    const path = resolve(FONTS_DIR, file)
    if (existsSync(path)) rmSync(path)
  }
}

// ── Google catalog (live, via the project's API key) ──

let googleCache: FontCatalogEntry[] | null = null

function variantsToWeights(variants: string[]): { weights: string[]; hasItalic: boolean } {
  const weights = new Set<string>()
  let hasItalic = false
  for (const v of variants) {
    if (v.includes('italic')) hasItalic = true
    const w = v === 'regular' || v === 'italic' ? '400' : v.replace('italic', '')
    if (/^\d+$/.test(w)) weights.add(w)
  }
  return { weights: [...weights].sort((a, b) => Number(a) - Number(b)), hasItalic }
}

function googleApiKey(): string | null {
  const proj = getInstalledProject()
  if (!proj) return null
  const doc = getWorkingDocument(proj.id)
  const design = doc?.design as
    | { siteSettings?: { integrations?: { googleFontsApiKey?: string } } }
    | null
  return design?.siteSettings?.integrations?.googleFontsApiKey?.trim() || null
}

async function loadGoogleCatalog(key: string): Promise<FontCatalogEntry[]> {
  if (googleCache) return googleCache
  const res = await fetch(
    `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${encodeURIComponent(key)}`,
  )
  if (!res.ok) throw new Error(`Google Fonts API error (${res.status})`)
  const data = (await res.json()) as { items?: Array<{ family: string; variants: string[]; category?: string }> }
  googleCache = (data.items ?? []).map((it) => {
    const { weights, hasItalic } = variantsToWeights(it.variants)
    return { family: it.family, source: 'google' as const, weights, category: it.category, hasItalic }
  })
  return googleCache
}

// ── Fontshare catalog (bundled — no public list API) ──

const FONTSHARE: Array<{ family: string; weights: string[]; italic?: boolean }> = [
  { family: 'General Sans', weights: ['200', '300', '400', '500', '600', '700'], italic: true },
  { family: 'Satoshi', weights: ['300', '400', '500', '700', '900'], italic: true },
  { family: 'Clash Display', weights: ['200', '300', '400', '500', '600', '700'] },
  { family: 'Clash Grotesk', weights: ['200', '300', '400', '500', '600', '700'] },
  { family: 'Cabinet Grotesk', weights: ['100', '200', '300', '400', '500', '700', '800', '900'] },
  { family: 'Switzer', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], italic: true },
  { family: 'Author', weights: ['100', '200', '300', '400', '500', '600', '700'] },
  { family: 'Ranade', weights: ['100', '300', '400', '500', '700'], italic: true },
  { family: 'Sentient', weights: ['200', '300', '400', '500', '700'], italic: true },
  { family: 'Melodrama', weights: ['300', '400', '500', '600', '700'] },
  { family: 'Chillax', weights: ['200', '300', '400', '500', '600', '700'] },
  { family: 'Panchang', weights: ['200', '300', '400', '500', '600', '700', '800'] },
  { family: 'Zodiak', weights: ['100', '200', '300', '400', '500', '700', '800', '900'], italic: true },
  { family: 'Erode', weights: ['300', '400', '500', '600', '700'], italic: true },
  { family: 'Bespoke Serif', weights: ['200', '300', '400', '500', '600', '700', '800'], italic: true },
  { family: 'Bespoke Sans', weights: ['200', '300', '400', '500', '600', '700', '800'], italic: true },
  { family: 'Boska', weights: ['100', '300', '400', '500', '700', '900'], italic: true },
  { family: 'Gambetta', weights: ['300', '400', '500', '600', '700'], italic: true },
  { family: 'Pally', weights: ['400', '500', '600', '700'] },
  { family: 'Supreme', weights: ['100', '200', '300', '400', '500', '700', '800'], italic: true },
  { family: 'Tanker', weights: ['400'] },
  { family: 'Excon', weights: ['300', '400', '500', '700'] },
  { family: 'Nippo', weights: ['200', '300', '400', '500', '700'] },
  { family: 'Quilon', weights: ['400'] },
  { family: 'Khand', weights: ['300', '400', '500', '600', '700'] },
  { family: 'Poppins', weights: ['400', '500', '600', '700'] },
  { family: 'Stardom', weights: ['400'] },
  { family: 'Array', weights: ['400', '700'] },
  { family: 'Rowan', weights: ['300', '400', '500', '600', '700', '800', '900'], italic: true },
  { family: 'Sharpie', weights: ['300', '400', '500', '600', '700'], italic: true },
]

function fontshareCatalog(): FontCatalogEntry[] {
  return FONTSHARE.map((f) => ({
    family: f.family,
    source: 'fontshare' as const,
    weights: f.weights,
    hasItalic: !!f.italic,
  }))
}

function fontshareSlug(family: string): string {
  return family.toLowerCase().replace(/\s+/g, '-')
}

/** Search the catalog for a source, filtered by query. */
export async function searchFonts(
  source: 'google' | 'fontshare',
  q: string,
): Promise<FontCatalogEntry[]> {
  const needle = q.trim().toLowerCase()
  let list: FontCatalogEntry[]
  if (source === 'fontshare') {
    list = fontshareCatalog()
  } else {
    const key = googleApiKey()
    if (!key) throw new Error('NO_GOOGLE_KEY')
    list = await loadGoogleCatalog(key)
  }
  const matched = needle ? list.filter((f) => f.family.toLowerCase().includes(needle)) : list
  return matched.slice(0, 40)
}

// ── Import (fetch CSS → download woff2 → self-host) ──

interface ParsedFace {
  weight: string
  style: 'normal' | 'italic'
  url: string
  format: string
  unicodeRange?: string
  subset?: string
}

// Parse @font-face blocks, keeping each block's preceding /* subset */ comment.
function parseFontFaces(css: string): ParsedFace[] {
  const out: ParsedFace[] = []
  const blockRe = /(?:\/\*\s*([\w-]+)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(css))) {
    const subset = m[1]
    const body = m[2] ?? ''
    const weight = (/font-weight:\s*([^;]+);/.exec(body)?.[1] ?? '400').trim().split(/\s+/)[0]!
    const style = /font-style:\s*italic/.test(body) ? 'italic' : 'normal'
    // Prefer a woff2 url; fall back to any url() with a format.
    const woff2 = /url\(([^)]+)\)\s*format\(['"]?woff2['"]?\)/.exec(body)
    const anyUrl = woff2 ?? /url\(([^)]+)\)\s*format\(['"]?(\w+)['"]?\)/.exec(body)
    if (!anyUrl) continue
    const url = anyUrl[1]!.replace(/['"]/g, '')
    const format = woff2 ? 'woff2' : (anyUrl[2] ?? 'woff2')
    const unicodeRange = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim()
    out.push({ weight, style, url, format, unicodeRange, subset })
  }
  return out
}

async function fetchCss(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) throw new Error(`Font CSS fetch failed (${res.status})`)
  return res.text()
}

async function downloadFace(face: ParsedFace): Promise<FontFaceDTO> {
  const res = await fetch(face.url, { headers: { 'User-Agent': BROWSER_UA } })
  if (!res.ok) throw new Error(`Font file fetch failed (${res.status})`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const ext = face.format === 'truetype' ? 'ttf' : face.format === 'opentype' ? 'otf' : face.format
  const { url } = saveFontFile(bytes, ext)
  return { weight: face.weight, style: face.style, url, format: face.format }
}

// Only self-host Latin subsets (covers Western/accented text). Non-Latin is a
// known v1 limitation — keeps the file count sane.
function keepFace(f: ParsedFace): boolean {
  if (!f.subset) return true
  return f.subset === 'latin' || f.subset === 'latin-ext'
}

export async function importWebFont(payload: FontImportPayload): Promise<FontFamilyDTO> {
  const { source, family, weights } = payload
  const list = weights.length ? weights : ['400']
  let cssUrl: string
  if (source === 'google') {
    const spec = list.map((w) => w).join(';')
    cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${spec}&display=swap`
  } else {
    cssUrl = `https://api.fontshare.com/v2/css?f[]=${fontshareSlug(family)}@${list.join(',')}&display=swap`
  }
  const css = await fetchCss(cssUrl)
  const parsed = parseFontFaces(css).filter(keepFace)
  if (!parsed.length) throw new Error('No usable font faces found.')
  const faces = await Promise.all(parsed.map(downloadFace))
  return { id: randomId(), name: family, source, faces }
}

// ── Custom upload ──

export function saveCustomFace(
  bytes: Buffer,
  filename: string,
  weight: string,
  style: 'normal' | 'italic',
): FontFaceDTO {
  const ext = (filename.slice(filename.lastIndexOf('.') + 1) || 'woff2').toLowerCase()
  const { url } = saveFontFile(bytes, ext)
  return { weight, style, url, format: FORMAT_BY_EXT[ext] ?? 'woff2' }
}
