// Faithful render pipeline: node tree → HTML, style classes → real CSS.
// Pure and framework-free — powers the editor preview and (later) the SSR
// public runtime.
export { renderNodeToHtml } from './html'
export { compileCss } from './css'
export type { RenderContext } from './context'

import type { CanvasNode, GlobalStyles, StyleClass } from '@/types/canvas'
import { renderNodeToHtml } from './html'
import { compileCss } from './css'
import { interactionsRuntimeScript } from './interactionsRuntime'
import type { RenderContext } from './context'

// Convenience: assemble a full standalone HTML document for a page body.
export interface DocumentHead {
  title?: string
  description?: string
  noIndex?: boolean
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
): string {
  const css = compileCss(styleClasses, globalStyles)
  const html = renderNodeToHtml(body, ctx)
  let headTags = ''
  if (head.title) headTags += `<title>${head.title.replace(/</g, '&lt;')}</title>`
  if (head.description) headTags += `<meta name="description" content="${escAttr(head.description)}">`
  if (head.noIndex) headTags += '<meta name="robots" content="noindex, nofollow">'
  // Only ship the interaction runtime when the page actually uses interactions.
  const ixScript = html.includes('data-sb-ix') ? `<script>${interactionsRuntimeScript()}</script>` : ''
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    headTags +
    `<style>${css}</style></head><body>${html}${ixScript}</body></html>`
  )
}
