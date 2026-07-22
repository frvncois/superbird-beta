// Resolve Tailwind utility classes to inline CSS declarations so they render in
// the editor canvas (the published site uses the Tailwind CDN). A curated,
// extensible subset — unknown utilities are ignored here but still render live.

type Decls = Record<string, string>

// Spacing scale: n → n * 0.25rem, plus px/auto/full and fractions.
function spaceValue(v: string): string | undefined {
  if (v === 'px') return '1px'
  if (v === 'auto') return 'auto'
  if (v === 'full') return '100%'
  if (v === 'screen') return '100vw'
  if (v === 'min') return 'min-content'
  if (v === 'max') return 'max-content'
  if (v === 'fit') return 'fit-content'
  const frac = v.match(/^(\d+)\/(\d+)$/)
  if (frac) return `${((Number(frac[1]) / Number(frac[2])) * 100).toFixed(4).replace(/\.?0+$/, '')}%`
  const n = Number(v)
  if (!Number.isNaN(n)) return `${n * 0.25}rem`
  return undefined
}

const SPACING_SIDES: Record<string, string[]> = {
  p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'],
  pt: ['padding-top'], pr: ['padding-right'], pb: ['padding-bottom'], pl: ['padding-left'],
  m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'],
  mt: ['margin-top'], mr: ['margin-right'], mb: ['margin-bottom'], ml: ['margin-left'],
  gap: ['gap'], 'gap-x': ['column-gap'], 'gap-y': ['row-gap'],
}

const DISPLAY: Record<string, string> = {
  block: 'block', 'inline-block': 'inline-block', inline: 'inline', flex: 'flex',
  'inline-flex': 'inline-flex', grid: 'grid', 'inline-grid': 'inline-grid', hidden: 'none',
}
const FLEX_DIR: Record<string, string> = { 'flex-row': 'row', 'flex-row-reverse': 'row-reverse', 'flex-col': 'column', 'flex-col-reverse': 'column-reverse' }
const ALIGN: Record<string, string> = { 'items-start': 'flex-start', 'items-center': 'center', 'items-end': 'flex-end', 'items-stretch': 'stretch', 'items-baseline': 'baseline' }
const JUSTIFY: Record<string, string> = { 'justify-start': 'flex-start', 'justify-center': 'center', 'justify-end': 'flex-end', 'justify-between': 'space-between', 'justify-around': 'space-around', 'justify-evenly': 'space-evenly' }
const TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify'])
const FONT_SIZE: Record<string, string> = { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem', '7xl': '4.5rem', '8xl': '6rem', '9xl': '8rem' }
const FONT_WEIGHT: Record<string, string> = { thin: '100', extralight: '200', light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800', black: '900' }
const LEADING: Record<string, string> = { none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2' }
const RADIUS: Record<string, string> = { none: '0', sm: '0.125rem', '': '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', '3xl': '1.5rem', full: '9999px' }
const SHADOW: Record<string, string> = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', none: 'none',
}

// Curated Tailwind color palette (shade → hex), common families.
const COLORS: Record<string, Record<string, string>> = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
  zinc: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
  orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12', 950: '#422006' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63', 950: '#083344' },
  sky: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' },
  blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843', 950: '#500724' },
  rose: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' },
}

function color(rest: string): string | undefined {
  if (rest === 'white') return '#ffffff'
  if (rest === 'black') return '#000000'
  if (rest === 'transparent') return 'transparent'
  if (rest === 'current') return 'currentColor'
  const m = rest.match(/^([a-z]+)-(\d{2,3})$/)
  if (m) return COLORS[m[1]!]?.[m[2]!]
  // bare family → 500
  return COLORS[rest]?.['500']
}

function classToDecls(cls: string): Decls | null {
  // Spacing (longest prefix first so 'px' beats 'p')
  for (const prefix of Object.keys(SPACING_SIDES).sort((a, b) => b.length - a.length)) {
    const m = cls.match(new RegExp(`^${prefix}-(.+)$`))
    if (m) {
      const val = spaceValue(m[1]!)
      if (val === undefined) return null
      const d: Decls = {}
      for (const p of SPACING_SIDES[prefix]!) d[p] = val
      return d
    }
  }
  // Display / flex / align / justify (exact)
  if (cls in DISPLAY) return { display: DISPLAY[cls]! }
  if (cls in FLEX_DIR) return { 'flex-direction': FLEX_DIR[cls]! }
  if (cls in ALIGN) return { 'align-items': ALIGN[cls]! }
  if (cls in JUSTIFY) return { 'justify-content': JUSTIFY[cls]! }
  if (cls === 'flex-wrap') return { 'flex-wrap': 'wrap' }
  if (cls === 'flex-nowrap') return { 'flex-wrap': 'nowrap' }
  if (cls === 'flex-1') return { flex: '1 1 0%' }
  if (cls === 'flex-auto') return { flex: '1 1 auto' }
  // Position
  if (['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(cls)) return { position: cls }
  // Sizing
  const size = cls.match(/^(w|h|min-w|min-h|max-w|max-h)-(.+)$/)
  if (size) {
    const val = spaceValue(size[2]!) ?? (size[2] === 'screen' ? (size[1]!.includes('h') ? '100vh' : '100vw') : undefined)
    if (val === undefined) return null
    const map: Record<string, string> = { w: 'width', h: 'height', 'min-w': 'min-width', 'min-h': 'min-height', 'max-w': 'max-width', 'max-h': 'max-height' }
    return { [map[size[1]!]!]: val }
  }
  // Text
  const talign = cls.match(/^text-(left|center|right|justify)$/)
  if (talign && TEXT_ALIGN.has(talign[1]!)) return { 'text-align': talign[1]! }
  const tsize = cls.match(/^text-(.+)$/)
  if (tsize && tsize[1]! in FONT_SIZE) return { 'font-size': FONT_SIZE[tsize[1]!]! }
  const weight = cls.match(/^font-(.+)$/)
  if (weight && weight[1]! in FONT_WEIGHT) return { 'font-weight': FONT_WEIGHT[weight[1]!]! }
  const lead = cls.match(/^leading-(.+)$/)
  if (lead) {
    const v = lead[1]! in LEADING ? LEADING[lead[1]!]! : spaceValue(lead[1]!)
    if (v !== undefined) return { 'line-height': v }
  }
  // Radius
  if (cls === 'rounded') return { 'border-radius': RADIUS['']! }
  const rad = cls.match(/^rounded-(.+)$/)
  if (rad && rad[1]! in RADIUS) return { 'border-radius': RADIUS[rad[1]!]! }
  // Shadow
  if (cls === 'shadow') return { 'box-shadow': SHADOW['']! }
  const sh = cls.match(/^shadow-(.+)$/)
  if (sh && sh[1]! in SHADOW) return { 'box-shadow': SHADOW[sh[1]!]! }
  // Opacity
  const op = cls.match(/^opacity-(\d+)$/)
  if (op) return { opacity: String(Number(op[1]) / 100) }
  // Colors
  const col = cls.match(/^(bg|text|border)-(.+)$/)
  if (col) {
    const hex = color(col[2]!)
    if (hex) {
      const prop = col[1] === 'bg' ? 'background-color' : col[1] === 'text' ? 'color' : 'border-color'
      return { [prop]: hex }
    }
  }
  return null
}

export function tailwindToStyles(classes: string[]): Decls {
  const out: Decls = {}
  for (const cls of classes) {
    const d = classToDecls(cls)
    if (d) Object.assign(out, d)
  }
  return out
}
