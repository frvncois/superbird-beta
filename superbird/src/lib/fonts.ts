import type { FontFace, FontFamily } from '@/types/canvas'

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

// Anything with a name + self-hosted faces (a FontFamily or a default font).
interface FaceCarrier {
  name: string
  faces: FontFace[]
}

/** Emit @font-face rules for every self-hosted face in the given families. */
export function fontFaceCss(families: FaceCarrier[]): string {
  const out: string[] = []
  for (const family of families) {
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

/** Build the CSS font-family value for a font-set family (quoted + fallback). */
export function fontSetStack(family: FontFamily): string {
  return `"${family.name}", sans-serif`
}
