// Faithful render pipeline: node tree → HTML, style classes → real CSS.
// Pure and framework-free — powers the editor preview and the SSR public runtime.
export { renderNodeToHtml } from './html'
export { compilePageCss, compileSiteCss } from './css'
export { interactionsScript } from './interactionsRuntime'
export type { RenderContext } from './context'

import type { CanvasNode, GlobalStyles, StyleClass } from '@/types/canvas'
import { renderNodeToHtml } from './html'
import { compilePageCss } from './css'
import { interactionsRuntimeScript } from './interactionsRuntime'
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
  const walk = (n: CanvasNode) => {
    if (n.interactions && n.interactions.length > 0) map[n.id] = n.interactions
    for (const child of n.children) walk(child)
  }
  walk(node)
  return map
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
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

  let headTags = ''
  if (head.title) headTags += `<title>${head.title.replace(/</g, '&lt;')}</title>`
  if (head.description) headTags += `<meta name="description" content="${escAttr(head.description)}">`
  if (head.noIndex) headTags += '<meta name="robots" content="noindex, nofollow">'

  // Styles: external <link> when a href is given, otherwise inline <style>
  // resolved exactly like the editor canvas (class order honored, custom +
  // Tailwind unified).
  const styleTag = assets.styleHref
    ? `<link rel="stylesheet" href="${escAttr(assets.styleHref)}">`
    : `<style>${compilePageCss(body, styleClasses, globalStyles)}</style>`

  // Script: only when the page actually uses interactions. External <script src>
  // when given; otherwise inline the data + runtime. `<` in the embedded JSON is
  // escaped so a value can never break out of the inline <script>.
  let scriptTag = ''
  if (hasIx) {
    if (assets.scriptSrc) {
      scriptTag = `<script src="${escAttr(assets.scriptSrc)}" defer></script>`
    } else {
      const json = JSON.stringify(ixMap).replace(/</g, '\\u003c')
      scriptTag = `<script>window.__SB_IX__=${json};${interactionsRuntimeScript()}</script>`
    }
  }

  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    headTags +
    styleTag +
    `</head><body>${html}${scriptTag}</body></html>`
  )
}
