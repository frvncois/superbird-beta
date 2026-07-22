import type { FontFace } from '@/types/canvas'

// The "Default" fonts shown in the font-family picker — the same for every
// project. All are self-hosted: their woff2 files live in `server/assets/fonts/`
// (committed) and serve via the public /fonts/:file route, so no runtime call to
// any font API is ever made.
//
// To change the set: add/remove woff2 files in `server/assets/fonts/` and edit
// the entries below (`url` is `/fonts/<filename>`). @font-face is emitted
// automatically for anything with `faces`.
export type FontCategory = 'Sans' | 'Serif' | 'Mono'

export interface DefaultFont {
  name: string
  // CSS font-family value applied when this font is chosen.
  value: string
  // Shown as a badge in the picker (Sans / Serif / Mono).
  category?: FontCategory
  // Self-hosted faces — @font-face is emitted from these.
  faces?: FontFace[]
}

export const DEFAULT_FONTS: DefaultFont[] = [
  {
    name: 'Google Sans',
    value: '"Google Sans", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/google-sans-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/google-sans-500.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/google-sans-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Inter',
    value: '"Inter", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/inter-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/inter-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/inter-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/inter-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'DM Sans',
    value: '"DM Sans", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/dm-sans-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/dm-sans-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/dm-sans-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/dm-sans-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Archivo Black',
    value: '"Archivo Black", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/archivo-black-400.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Archivo',
    value: '"Archivo", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/archivo-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/archivo-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/archivo-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/archivo-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Manrope',
    value: '"Manrope", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/manrope-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/manrope-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/manrope-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/manrope-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Lora',
    value: '"Lora", serif',
    category: 'Serif',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/lora-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/lora-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/lora-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/lora-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Bricolage Grotesque',
    value: '"Bricolage Grotesque", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/bricolage-grotesque-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/bricolage-grotesque-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/bricolage-grotesque-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/bricolage-grotesque-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Plus Jakarta Sans',
    value: '"Plus Jakarta Sans", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/plus-jakarta-sans-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/plus-jakarta-sans-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/plus-jakarta-sans-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/plus-jakarta-sans-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Inconsolata',
    value: '"Inconsolata", monospace',
    category: 'Mono',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/inconsolata-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/inconsolata-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/inconsolata-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/inconsolata-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'IBM Plex Sans',
    value: '"IBM Plex Sans", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/ibm-plex-sans-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/ibm-plex-sans-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/ibm-plex-sans-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/ibm-plex-sans-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Space Grotesk',
    value: '"Space Grotesk", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/space-grotesk-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/space-grotesk-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/space-grotesk-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/space-grotesk-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'JetBrains Mono',
    value: '"JetBrains Mono", monospace',
    category: 'Mono',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/jetbrains-mono-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/jetbrains-mono-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/jetbrains-mono-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/jetbrains-mono-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'PT Serif',
    value: '"PT Serif", serif',
    category: 'Serif',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/pt-serif-400.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/pt-serif-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Cormorant Garamond',
    value: '"Cormorant Garamond", serif',
    category: 'Serif',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/cormorant-garamond-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/cormorant-garamond-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/cormorant-garamond-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/cormorant-garamond-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Public Sans',
    value: '"Public Sans", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/public-sans-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/public-sans-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/public-sans-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/public-sans-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'EB Garamond',
    value: '"EB Garamond", serif',
    category: 'Serif',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/eb-garamond-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/eb-garamond-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/eb-garamond-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/eb-garamond-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Sora',
    value: '"Sora", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/sora-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/sora-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/sora-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/sora-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Inter Tight',
    value: '"Inter Tight", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/inter-tight-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/inter-tight-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/inter-tight-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/inter-tight-700.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Instrument Serif',
    value: '"Instrument Serif", serif',
    category: 'Serif',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/instrument-serif-400.woff2', format: 'woff2' },
    ],
  },
  {
    name: 'Schibsted Grotesk',
    value: '"Schibsted Grotesk", sans-serif',
    category: 'Sans',
    faces: [
      { weight: '400', style: 'normal', url: '/fonts/schibsted-grotesk-400.woff2', format: 'woff2' },
      { weight: '500', style: 'normal', url: '/fonts/schibsted-grotesk-500.woff2', format: 'woff2' },
      { weight: '600', style: 'normal', url: '/fonts/schibsted-grotesk-600.woff2', format: 'woff2' },
      { weight: '700', style: 'normal', url: '/fonts/schibsted-grotesk-700.woff2', format: 'woff2' },
    ],
  },
]

// Family-shaped view of the file-backed defaults, for @font-face emission.
export function defaultFontFamilies(): Array<{ name: string; faces: FontFace[] }> {
  return DEFAULT_FONTS.filter((f) => f.faces?.length).map((f) => ({ name: f.name, faces: f.faces! }))
}
