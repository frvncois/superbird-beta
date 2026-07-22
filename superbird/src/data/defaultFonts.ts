import type { FontFace } from '@/types/canvas'

// The "Default" fonts shown in the font-family picker — the same for every
// project. Two kinds are supported:
//
//  • System fonts — no files needed; `value` is a CSS font stack, no `faces`.
//  • Bundled fonts — drop the file(s) in `server/assets/fonts/` (committed) and
//    add `faces` pointing at `/fonts/<filename>`. @font-face is emitted
//    automatically and the file serves via the public /fonts/:file route.
//
// To add a bundled default: copy e.g. `inter-400.woff2` into
// `server/assets/fonts/`, then add an entry like the commented Inter example.
export interface DefaultFont {
  name: string
  // CSS font-family value applied when this font is chosen.
  value: string
  // Present for file-backed defaults; omitted for system fonts.
  faces?: FontFace[]
}

export const DEFAULT_FONTS: DefaultFont[] = [
  { name: 'System UI', value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { name: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { name: 'Courier', value: '"Courier New", Courier, monospace' },
  // Example bundled default (uncomment once the files exist in server/assets/fonts/):
  // {
  //   name: 'Inter',
  //   value: '"Inter", sans-serif',
  //   faces: [
  //     { weight: '400', style: 'normal', url: '/fonts/inter-400.woff2', format: 'woff2' },
  //     { weight: '700', style: 'normal', url: '/fonts/inter-700.woff2', format: 'woff2' },
  //   ],
  // },
]

// Family-shaped view of the file-backed defaults, for @font-face emission.
export function defaultFontFamilies(): Array<{ name: string; faces: FontFace[] }> {
  return DEFAULT_FONTS.filter((f) => f.faces?.length).map((f) => ({ name: f.name, faces: f.faces! }))
}
