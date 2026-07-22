import type { FontFamily } from '@/types/canvas'

// Pure font helpers shared by the editor canvas and the render pipeline.

const FORMAT_HINT: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

function formatFor(url: string, hint?: string): string {
  if (hint) return FORMAT_HINT[hint] ?? hint
  const ext = url.slice(url.lastIndexOf('.') + 1).toLowerCase()
  return FORMAT_HINT[ext] ?? 'woff2'
}

/** Emit @font-face rules for every self-hosted face in the project's font set. */
export function fontFaceCss(fontSet: FontFamily[]): string {
  const out: string[] = []
  for (const family of fontSet) {
    for (const face of family.faces) {
      if (!face.url) continue
      const decls = [
        `font-family:"${family.name}"`,
        `font-style:${face.style}`,
        `font-weight:${face.weight}`,
        'font-display:swap',
        `src:url("${face.url}") format("${formatFor(face.url, face.format)}")`,
      ]
      out.push(`@font-face{${decls.join(';')}}`)
    }
  }
  return out.join('')
}

// The 10 web-safe base fonts offered in the font-family picker. Value is a full
// CSS font stack; label is what the user sees.
export interface BasicFont {
  label: string
  stack: string
}
export const BASIC_FONTS: BasicFont[] = [
  { label: 'System UI', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { label: 'Helvetica', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', stack: 'Tahoma, Verdana, Segoe, sans-serif' },
  { label: 'Trebuchet MS', stack: '"Trebuchet MS", Tahoma, sans-serif' },
  { label: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
  { label: 'Garamond', stack: 'Garamond, "Times New Roman", serif' },
  { label: 'Courier New', stack: '"Courier New", Courier, monospace' },
]

/** Build the CSS font-family value for a font-set family (quoted + fallback). */
export function fontSetStack(family: FontFamily): string {
  return `"${family.name}", sans-serif`
}
