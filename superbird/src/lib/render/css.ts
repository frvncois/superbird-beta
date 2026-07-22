import type { Breakpoint, CanvasNode, GlobalStyles, StyleClass, StyleState, TypographySettings } from '@/types/canvas'
import { resolveStyles } from '@/lib/styles'
import { classToDecls } from '@/lib/tailwindToStyles'

// Compile the global tokens + style-class registry into a real stylesheet:
// breakpoints as @media, states as pseudo-classes. This is the "emit real
// rules" sibling of lib/styles.resolveStyles — what makes classes work as
// designed instead of the editor's flattened inline styles.

// Cascade widths (max-width), matching resolveStyles' desktop→tablet→mobile order.
const MEDIA: Record<Exclude<Breakpoint, 'desktop'>, number> = { tablet: 768, mobile: 375 }

const STATE_SELECTOR: Record<StyleState, string> = {
  default: '',
  hover: ':hover',
  focus: ':focus',
  active: ':active',
  visited: ':visited',
}

function decls(styles: Record<string, string> | undefined): string {
  if (!styles) return ''
  return Object.entries(styles)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

// CSS.escape isn't available in Node; escape a class name for a selector.
function escapeClass(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

function rulesForBreakpoint(name: string, states: Record<StyleState, Record<string, string>>): string {
  const sel = `.${escapeClass(name)}`
  const out: string[] = []
  for (const state of Object.keys(states) as StyleState[]) {
    const body = decls(states[state])
    if (!body) continue
    out.push(`${sel}${STATE_SELECTOR[state]}{${body}}`)
  }
  return out.join('')
}

function compileClass(name: string, cls: StyleClass): string {
  const out: string[] = []
  const desktop = rulesForBreakpoint(name, cls.styles.desktop)
  if (desktop) out.push(desktop)
  for (const bp of ['tablet', 'mobile'] as const) {
    const inner = rulesForBreakpoint(name, cls.styles[bp])
    if (inner) out.push(`@media (max-width:${MEDIA[bp]}px){${inner}}`)
  }
  return out.join('')
}

function globalVars(g: GlobalStyles): string {
  const vars: string[] = []
  for (const [name, value] of Object.entries(g.colors)) vars.push(`--global-${name}:${value}`)
  vars.push(`--global-font-primary:${g.fonts.primary}`)
  vars.push(`--global-font-secondary:${g.fonts.secondary}`)
  for (const [name, value] of Object.entries(g.sizes)) vars.push(`--global-size-${name}:${value}`)
  return vars.join(';')
}

function typographyRules(t: TypographySettings): string {
  const out: string[] = []
  out.push(`body{font-size:${t.baseFontSize};line-height:${t.baseLineHeight}}`)
  for (const [tag, h] of Object.entries(t.headings)) {
    out.push(`${tag}{font-size:${h.fontSize};font-weight:${h.fontWeight};line-height:${h.lineHeight}}`)
  }
  out.push(`p{margin-bottom:${t.paragraph.marginBottom}}`)
  out.push(`a{color:${t.link.color};text-decoration:${t.link.decoration}}`)
  out.push(`a:hover{color:${t.link.hoverColor}}`)
  return out.join('')
}

// A Preflight-style reset so the published site shows only the design-system
// styles — no native button chrome, no browser margins/padding/borders. Author
// styles (classes) and global typography, both emitted after this, layer on top.
const RESET = [
  // Zero the big three everywhere; keep a solid border so a class only needs to
  // set border-width to get a visible border.
  '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}',
  'html{-webkit-text-size-adjust:100%;line-height:1.5;-moz-tab-size:4;tab-size:4}',
  'body{min-height:100vh;font-family:var(--global-font-primary,sans-serif);color:var(--global-text,#0a0a0a);-webkit-font-smoothing:antialiased}',
  // Media: block-level, never overflow.
  'img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle;max-width:100%}',
  'img,video{height:auto}',
  // Form controls inherit typography and lose native chrome.
  'input,button,textarea,select{font:inherit;color:inherit;background:transparent;border-radius:0;line-height:inherit}',
  'button,select{text-transform:none}',
  'button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;appearance:button}',
  'button,[role=button]{cursor:pointer}',
  ':disabled{cursor:default}',
  'textarea{resize:vertical}',
  '::placeholder{opacity:1;color:inherit}',
  // Links + lists neutralized (author styles them).
  'a{color:inherit;text-decoration:inherit}',
  'ol,ul,menu{list-style:none}',
  // Misc niceties.
  'table{border-collapse:collapse;border-spacing:0}',
  'summary{display:list-item}',
  'p,h1,h2,h3,h4,h5,h6{overflow-wrap:break-word}',
  '[hidden]{display:none}',
].join('')

// Responsive visibility utilities. Non-overlapping ranges matching the editor's
// desktop/tablet/mobile breakpoints; !important so hiding always wins.
const VISIBILITY = [
  '@media (max-width:375px){.sb-hide-mobile{display:none!important}}',
  '@media (min-width:376px) and (max-width:768px){.sb-hide-tablet{display:none!important}}',
  '@media (min-width:769px){.sb-hide-desktop{display:none!important}}',
].join('')

// Global base: tokens, reset, visibility utilities, typography. Same for every
// page; author styles layer on top.
function baseCss(globalStyles: GlobalStyles): string {
  const parts: string[] = []
  parts.push(`:root{${globalVars(globalStyles)}}`)
  parts.push(RESET)
  parts.push(VISIBILITY)
  parts.push(typographyRules(globalStyles.typography.desktop))
  for (const bp of ['tablet', 'mobile'] as const) {
    parts.push(`@media (max-width:${MEDIA[bp]}px){${typographyRules(globalStyles.typography[bp])}}`)
  }
  return parts.join('\n')
}

export function compileCss(styleClasses: Record<string, StyleClass>, globalStyles: GlobalStyles): string {
  const parts = [baseCss(globalStyles)]
  for (const [name, cls] of Object.entries(styleClasses)) parts.push(compileClass(name, cls))
  return parts.join('\n')
}

// ── Per-element compiler — identical resolution to the editor canvas ──
// Each element's styles are resolved from its class list IN ORDER (custom
// classes + base Tailwind utilities), so a class added later overrides an
// earlier one. Variants (hover:/md:/…) become scoped pseudo/media rules.

const MIN_BP: Record<string, string> = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }
const V_STATE: Record<string, string> = {
  hover: ':hover', focus: ':focus', active: ':active', visited: ':visited',
  'focus-within': ':focus-within', 'focus-visible': ':focus-visible', disabled: ':disabled', checked: ':checked',
}
const V_ANCESTOR: Record<string, string> = { 'group-hover': '.group:hover ', 'group-focus': '.group:focus ', dark: '.dark ' }
const CUSTOM_STATES: StyleState[] = ['hover', 'focus', 'active', 'visited']

function diff(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k in a) if (a[k] !== b[k]) out[k] = a[k]!
  return out
}
function declsImportant(o: Record<string, string>): string {
  return Object.entries(o).map(([k, v]) => `${k}:${v} !important`).join(';')
}

function elementRules(
  node: CanvasNode,
  styleClasses: Record<string, StyleClass>,
  base: string[],
  maxMedia: Record<string, string[]>,
  minMedia: Record<string, string[]>,
) {
  const sel = `[data-sb-s="${node.id}"]`
  const resolved: Record<Breakpoint, Record<string, string>> = {
    desktop: resolveStyles(node, styleClasses, 'desktop', 'default'),
    tablet: resolveStyles(node, styleClasses, 'tablet', 'default'),
    mobile: resolveStyles(node, styleClasses, 'mobile', 'default'),
  }
  // Base (desktop) + responsive deltas (desktop-first, max-width).
  if (Object.keys(resolved.desktop).length) base.push(`${sel}{${decls(resolved.desktop)}}`)
  const tDelta = diff(resolved.tablet, resolved.desktop)
  if (Object.keys(tDelta).length) (maxMedia['768px'] ??= []).push(`${sel}{${decls(tDelta)}}`)
  const mDelta = diff(resolved.mobile, resolved.tablet)
  if (Object.keys(mDelta).length) (maxMedia['375px'] ??= []).push(`${sel}{${decls(mDelta)}}`)

  // Custom class states per breakpoint (delta vs that breakpoint's default).
  for (const bp of ['desktop', 'tablet', 'mobile'] as const) {
    for (const st of CUSTOM_STATES) {
      const d = diff(resolveStyles(node, styleClasses, bp, st), resolved[bp])
      if (!Object.keys(d).length) continue
      const rule = `${sel}:${st}{${decls(d)}}`
      if (bp === 'desktop') base.push(rule)
      else (maxMedia[bp === 'tablet' ? '768px' : '375px'] ??= []).push(rule)
    }
  }

  // Tailwind variant utilities → pseudo / min-width media, !important.
  for (const cls of node.classes) {
    const parts = cls.split(':')
    const util = parts.pop()!
    if (parts.length === 0) continue
    const d = classToDecls(util)
    if (!d) continue
    let pseudo = ''
    let ancestor = ''
    let mq: string | null = null
    for (const v of parts) {
      if (v in MIN_BP) mq = MIN_BP[v]!
      else if (v in V_STATE) pseudo += V_STATE[v]
      else if (v in V_ANCESTOR) ancestor = V_ANCESTOR[v]! + ancestor
    }
    const rule = `${ancestor}${sel}${pseudo}{${declsImportant(d)}}`
    if (mq) (minMedia[mq] ??= []).push(rule)
    else base.push(rule)
  }
}

/** Compile a full page: global base + per-element rules (identical to canvas). */
export function compilePageCss(body: CanvasNode, styleClasses: Record<string, StyleClass>, globalStyles: GlobalStyles): string {
  const base: string[] = []
  const maxMedia: Record<string, string[]> = {}
  const minMedia: Record<string, string[]> = {}

  const walk = (node: CanvasNode) => {
    if (node.classes.length > 0 || Object.keys(node.styles).length > 0) {
      elementRules(node, styleClasses, base, maxMedia, minMedia)
    }
    for (const child of node.children) walk(child)
  }
  walk(body)

  const parts = [baseCss(globalStyles), base.join('')]
  for (const w of ['768px', '375px']) if (maxMedia[w]) parts.push(`@media (max-width:${w}){${maxMedia[w]!.join('')}}`)
  for (const w of ['640px', '768px', '1024px', '1280px', '1536px']) if (minMedia[w]) parts.push(`@media (min-width:${w}){${minMedia[w]!.join('')}}`)
  return parts.join('\n')
}
