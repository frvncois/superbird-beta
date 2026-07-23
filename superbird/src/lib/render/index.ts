// Faithful render pipeline: node tree → HTML, style classes → real CSS.
// Pure and framework-free — powers the editor preview and the SSR public runtime.
export { renderNodeToHtml } from './html'
export { compilePageCss, compileSiteCss } from './css'
export { interactionsScript } from './interactionsRuntime'
export { formsRuntimeScript } from './formsRuntime'
export { storefrontRuntimeScript } from './storefrontRuntime'
export type { RenderContext } from './context'

import type { CanvasNode, GlobalStyles, StyleClass } from '@/types/canvas'
import { renderNodeToHtml } from './html'
import { compilePageCss } from './css'
import { interactionsRuntimeScript } from './interactionsRuntime'
import { escapeAttr } from './escape'
import type { RenderContext } from './context'

// Convenience: assemble a full standalone HTML document for a page body.
export interface DocumentHead {
  title?: string
  description?: string
  noIndex?: boolean
}

// Where the page's CSS/JS come from. Omit both (the default) for a
// self-contained document (editor Preview): styles inline in <head>, the
// interaction runtime + data inline before </body>. Provide hrefs for the SSR
// site so the page links to shared external files.
export interface RenderAssets {
  styleHref?: string
  scriptSrc?: string
}

type IxMap = Record<string, NonNullable<CanvasNode['interactions']>>

// Walk a body and collect each interactive node's interactions, keyed by node
// id — the shape embedded as window.__SB_IX__ and read by the runtime.
export function collectInteractions(node: CanvasNode): IxMap {
  const map: IxMap = {}
  const walk = (n: CanvasNode, depth: number) => {
    if (depth > 64) return // stack-overflow guard (mirrors render/html.ts)
    if (n.interactions && n.interactions.length > 0) map[n.id] = n.interactions
    for (const child of n.children) walk(child, depth + 1)
  }
  walk(node, 0)
  return map
}

export function renderDocument(
  body: CanvasNode,
  styleClasses: Record<string, StyleClass>,
  globalStyles: GlobalStyles,
  ctx: RenderContext,
  head: DocumentHead = {},
  assets: RenderAssets = {},
): string {
  const html = renderNodeToHtml(body, ctx)
  const ixMap = collectInteractions(body)
  const hasIx = Object.keys(ixMap).length > 0
  // The shared runtime also powers forms + the storefront (login/etc.), so it
  // must load on those pages even without interactions.
  const needsScript = hasIx || hasRuntimeNode(body) || !!ctx.systemKey

  let headTags = ''
  if (head.title) headTags += `<title>${head.title.replace(/</g, '&lt;')}</title>`
  if (head.description) headTags += `<meta name="description" content="${escapeAttr(head.description)}">`
  if (head.noIndex) headTags += '<meta name="robots" content="noindex, nofollow">'

  // Styles: external <link> when a href is given, otherwise inline <style>
  // resolved exactly like the editor canvas (class order honored, custom +
  // Tailwind unified).
  const styleTag = assets.styleHref
    ? `<link rel="stylesheet" href="${escapeAttr(assets.styleHref)}">`
    : // Escape `<` so a style value can't break out of the inline <style> (Preview).
      `<style>${compilePageCss(body, styleClasses, globalStyles).replace(/</g, '\\3c ')}</style>`

  // Script: only when the page actually uses interactions. External <script src>
  // when given; otherwise inline the data + runtime. `<` in the embedded JSON is
  // escaped so a value can never break out of the inline <script>.
  let scriptTag = ''
  if (assets.scriptSrc) {
    if (needsScript) scriptTag = `<script src="${escapeAttr(assets.scriptSrc)}" defer></script>`
  } else if (hasIx) {
    // Inline path (editor Preview): only interactions are needed there.
    const json = JSON.stringify(ixMap).replace(/</g, '\\u003c')
    scriptTag = `<script>window.__SB_IX__=${json};${interactionsRuntimeScript()}</script>`
  }

  let bodyAttrs = ctx.systemKey ? ` data-sb-system="${ctx.systemKey}"` : ''
  if (ctx.productEntryId) bodyAttrs += ` data-sb-entry="${escapeAttr(ctx.productEntryId)}"`
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    headTags +
    styleTag +
    `</head><body${bodyAttrs}>${html}${scriptTag}</body></html>`
  )
}

// Any node that the shared runtime needs to wire (a form, or a prebuilt element).
function hasRuntimeNode(node: CanvasNode): boolean {
  if (node.type === 'form' || node.element) return true
  return (node.children ?? []).some(hasRuntimeNode)
}
