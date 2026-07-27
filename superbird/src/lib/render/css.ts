import type { Breakpoint, BreakpointDef, CanvasNode, GlobalStyles, StyleClass, StyleState, TypographySettings } from '@/types/canvas'
import { breakpointCascade } from '@/lib/styles'
import { DEFAULT_BREAKPOINTS } from '@/constants/canvas'
import { classToDecls, escapeClass, MIN_BP, STATE_PSEUDO, ANCESTOR } from '@/lib/tailwindToStyles'
import { fontFaceCss } from '@/lib/fonts'
import { defaultFontFamilies } from '@/data/defaultFonts'

// Compile the design into a real, CLASS-BASED stylesheet: global tokens/reset/
// typography + one rule per authored style class (`.name { … }`) with `@media`
// breakpoint deltas and `:hover/:focus/…` state deltas, plus deduped Tailwind
// utility rules. Styles are resolved identically to the editor canvas
// (lib/styles.resolveStyles). No per-element `[data-sb-s]` rules — the authored
// class names ARE the selectors; a node's own instance `styles` go inline (html.ts).

// Cascade widths (max-width) for the tag-based typography media blocks.
const MEDIA: Record<Exclude<Breakpoint, 'desktop'>, number> = { tablet: 768, mobile: 375 }

function decls(styles: Record<string, string> | undefined): string {
  if (!styles) return ''
  return Object.entries(styles)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

function globalVars(g: GlobalStyles): string {
  const vars: string[] = []
  for (const [name, value] of Object.entries(g.colors)) vars.push(`--global-${name}:${value}`)
  for (const [name, value] of Object.entries(g.fonts)) vars.push(`--global-font-${name}:${value}`)
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
  '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}',
  'html{-webkit-text-size-adjust:100%;line-height:1.5;-moz-tab-size:4;tab-size:4}',
  'body{min-height:100vh;font-family:var(--global-font-primary,sans-serif);color:var(--global-text,#0a0a0a);-webkit-font-smoothing:antialiased}',
  'img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle;max-width:100%}',
  'img,video{height:auto}',
  'input,button,textarea,select{font:inherit;color:inherit;background:transparent;border-radius:0;line-height:inherit}',
  'button,select{text-transform:none}',
  'button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;appearance:button}',
  'button,[role=button]{cursor:pointer}',
  ':disabled{cursor:default}',
  'textarea{resize:vertical}',
  '::placeholder{opacity:1;color:inherit}',
  'a{color:inherit;text-decoration:inherit}',
  'ol,ul,menu{list-style:none}',
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
  const faces = fontFaceCss([...defaultFontFamilies(), ...(globalStyles.fontSet ?? [])])
  if (faces) parts.push(faces)
  parts.push(`:root{${globalVars(globalStyles)}}`)
  parts.push(RESET)
  parts.push(VISIBILITY)
  parts.push(typographyRules(globalStyles.typography.desktop))
  for (const bp of ['tablet', 'mobile'] as const) {
    parts.push(`@media (max-width:${MEDIA[bp]}px){${typographyRules(globalStyles.typography[bp])}}`)
  }
  return parts.join('\n')
}

// ── Class-based compiler ──

const CUSTOM_STATES: StyleState[] = ['hover', 'focus', 'active', 'visited']

function diff(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k in a) if (a[k] !== b[k]) out[k] = a[k]!
  return out
}
function declsImportant(o: Record<string, string>): string {
  return Object.entries(o).map(([k, v]) => `${k}:${v} !important`).join(';')
}

// A style class's effective styles at a breakpoint/state — the per-class
// equivalent of resolveStyles (widest→narrowest cascade, state layered on
// default). Matches the canvas exactly for a node carrying just this class.
function resolveClassStyles(
  cls: StyleClass,
  breakpoint: string,
  state: StyleState,
  breakpoints: BreakpointDef[],
): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const b of breakpointCascade(breakpoint, breakpoints)) {
    const bpStyles = cls.styles[b]
    if (!bpStyles) continue
    Object.assign(merged, bpStyles.default)
    if (state !== 'default' && bpStyles[state]) Object.assign(merged, bpStyles[state])
  }
  return merged
}

// Split a raw (non-custom) class into: base utility, or variant utility, or
// neither (an unknown class → no rule, matching resolveStyles ignoring it).
function isVariant(cls: string): boolean {
  const util = cls.split(':').pop()!
  return cls.includes(':') && classToDecls(util) !== null
}

// Assemble base + class/utility rules across one or more page bodies. Shared
// rules are emitted once (O(classes + utilities)), not per element.
function compileBodiesCss(
  bodies: CanvasNode[],
  styleClasses: Record<string, StyleClass>,
  globalStyles: GlobalStyles,
): string {
  // Fall back to the seeded breakpoints for docs published before the registry.
  const breakpoints = globalStyles.breakpoints?.length ? globalStyles.breakpoints : DEFAULT_BREAKPOINTS
  const ordered = [...breakpoints].sort((a, b) => b.width - a.width) // widest → narrowest

  // Collect, in first-seen document order, every class actually used.
  const customOrder: string[] = []
  const customSeen = new Set<string>()
  const utilBase = new Set<string>()
  const utilVariant = new Set<string>()
  const walk = (node: CanvasNode, depth: number) => {
    if (depth > 64) return
    for (const c of node.classes) {
      if (styleClasses[c]) {
        if (!customSeen.has(c)) { customSeen.add(c); customOrder.push(c) }
      } else if (c.includes(':')) {
        if (isVariant(c)) utilVariant.add(c)
      } else if (classToDecls(c)) {
        utilBase.add(c)
      }
    }
    for (const child of node.children) walk(child, depth + 1)
  }
  for (const body of bodies) walk(body, 0)

  const customBase: string[] = [] // .name{…} + .name:state{…} at the widest breakpoint
  const utilRules: string[] = [] // base Tailwind utilities (!important → override classes)
  const variantBase: string[] = [] // hover:/group-*/dark: variant utilities (base pseudo)
  const maxMedia: Record<string, string[]> = {} // narrower-breakpoint deltas (custom classes)
  const minMedia: Record<string, string[]> = {} // responsive variant utilities (md:/lg:/…)

  // Custom style classes → one shared rule (+ breakpoint deltas + state deltas).
  for (const name of customOrder) {
    const cls = styleClasses[name]!
    const sel = `.${escapeClass(name)}`
    const resolvedDefault: Record<string, Record<string, string>> = {}
    ordered.forEach((bp, i) => {
      const cur = resolveClassStyles(cls, bp.id, 'default', breakpoints)
      resolvedDefault[bp.id] = cur
      if (i === 0) {
        if (Object.keys(cur).length) customBase.push(`${sel}{${decls(cur)}}`)
      } else {
        const d = diff(cur, resolvedDefault[ordered[i - 1]!.id]!)
        if (Object.keys(d).length) (maxMedia[`${bp.width}px`] ??= []).push(`${sel}{${decls(d)}}`)
      }
      for (const st of CUSTOM_STATES) {
        const d = diff(resolveClassStyles(cls, bp.id, st, breakpoints), cur)
        if (!Object.keys(d).length) continue
        const rule = `${sel}:${st}{${decls(d)}}`
        if (i === 0) customBase.push(rule)
        else (maxMedia[`${bp.width}px`] ??= []).push(rule)
      }
    })
  }

  // Base Tailwind utilities → deduped rules, !important so they override classes
  // (mirrors the "utility wins" intent; class-order edge cases documented).
  for (const u of utilBase) {
    const d = classToDecls(u)
    if (d && Object.keys(d).length) utilRules.push(`.${escapeClass(u)}{${declsImportant(d)}}`)
  }

  // Variant Tailwind utilities → escaped pseudo / min-width media rules, !important.
  for (const cls of utilVariant) {
    const parts = cls.split(':')
    const util = parts.pop()!
    const d = classToDecls(util)
    if (!d) continue
    let pseudo = ''
    let ancestor = ''
    let mq: string | null = null
    for (const v of parts) {
      if (v in MIN_BP) mq = MIN_BP[v]!
      else if (v in STATE_PSEUDO) pseudo += STATE_PSEUDO[v]
      else if (v in ANCESTOR) ancestor = ANCESTOR[v]! + ancestor
    }
    const rule = `${ancestor}.${escapeClass(cls)}${pseudo}{${declsImportant(d)}}`
    if (mq) (minMedia[mq] ??= []).push(rule)
    else variantBase.push(rule)
  }

  const parts = [baseCss(globalStyles), customBase.join(''), utilRules.join(''), variantBase.join('')]
  // Widest max-width first so a narrower breakpoint's rules override it.
  for (const w of Object.keys(maxMedia).sort((a, b) => parseInt(b) - parseInt(a))) {
    parts.push(`@media (max-width:${w}){${maxMedia[w]!.join('')}}`)
  }
  for (const w of ['640px', '768px', '1024px', '1280px', '1536px']) if (minMedia[w]) parts.push(`@media (min-width:${w}){${minMedia[w]!.join('')}}`)
  return parts.join('\n')
}

/** Compile a single page: global base + class/utility rules (identical to canvas). */
export function compilePageCss(body: CanvasNode, styleClasses: Record<string, StyleClass>, globalStyles: GlobalStyles): string {
  return compileBodiesCss([body], styleClasses, globalStyles)
}

/** Compile the whole site into one stylesheet (base once + shared class rules). */
export function compileSiteCss(bodies: CanvasNode[], styleClasses: Record<string, StyleClass>, globalStyles: GlobalStyles): string {
  return compileBodiesCss(bodies, styleClasses, globalStyles)
}
