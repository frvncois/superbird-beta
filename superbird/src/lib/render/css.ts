import type { Breakpoint, GlobalStyles, StyleClass, StyleState, TypographySettings } from '@/types/canvas'

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

const RESET =
  '*,*::before,*::after{box-sizing:border-box}' +
  'body{margin:0;font-family:var(--global-font-primary,sans-serif);color:var(--global-text,#0a0a0a)}' +
  'img{max-width:100%;height:auto;display:block}' +
  'a{color:inherit}' +
  '*{margin:0}'

export function compileCss(styleClasses: Record<string, StyleClass>, globalStyles: GlobalStyles): string {
  const parts: string[] = []
  parts.push(`:root{${globalVars(globalStyles)}}`)
  parts.push(RESET)

  // Global typography — desktop base, then tablet/mobile overrides.
  parts.push(typographyRules(globalStyles.typography.desktop))
  for (const bp of ['tablet', 'mobile'] as const) {
    parts.push(`@media (max-width:${MEDIA[bp]}px){${typographyRules(globalStyles.typography[bp])}}`)
  }

  for (const [name, cls] of Object.entries(styleClasses)) {
    parts.push(compileClass(name, cls))
  }
  return parts.join('\n')
}
