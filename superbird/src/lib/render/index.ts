// Faithful render pipeline: node tree → HTML, style classes → real CSS.
// Pure and framework-free — powers the editor preview and (later) the SSR
// public runtime.
export { renderNodeToHtml } from './html'
export { compileCss } from './css'
export type { RenderContext } from './context'

import type { CanvasNode, GlobalStyles, StyleClass } from '@/types/canvas'
import { renderNodeToHtml } from './html'
import { compileCss } from './css'
import type { RenderContext } from './context'

// Convenience: assemble a full standalone HTML document for a page body.
export function renderDocument(
  body: CanvasNode,
  styleClasses: Record<string, StyleClass>,
  globalStyles: GlobalStyles,
  ctx: RenderContext,
  title?: string,
): string {
  const css = compileCss(styleClasses, globalStyles)
  const html = renderNodeToHtml(body, ctx)
  const titleTag = title ? `<title>${title.replace(/</g, '&lt;')}</title>` : ''
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    titleTag +
    `<style>${css}</style></head><body>${html}</body></html>`
  )
}
