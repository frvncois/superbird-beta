import type { CanvasNode, Entry } from '@/types/canvas'
import { CONTAINER_TYPES } from '@/constants/canvas'
import { renderMarkdown } from '@/lib/markdown'
import type { RenderContext } from './context'

// Node tree → faithful HTML. Real elements (img/a/form controls), resolved
// content/media/links, no editor chrome. Framework-free so the SSR runtime can
// reuse it verbatim.
//
// Not yet handled (deferred, flagged in docs): responsive visibility hide and
// interaction playback.

const VOID_TAGS = new Set(['img', 'input', 'br', 'hr', 'source', 'area', 'base', 'col', 'meta', 'wbr'])

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

function attr(name: string, value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return ''
  return ` ${name}="${escapeAttr(value)}"`
}

function buildAttributes(node: CanvasNode, ctx: RenderContext, entry: Entry | undefined): string {
  const classes = [...node.classes]
  if (node.advanced?.customCssClass) classes.push(node.advanced.customCssClass)
  // Responsive visibility
  if (node.visibility?.hideDesktop) classes.push('sb-hide-desktop')
  if (node.visibility?.hideTablet) classes.push('sb-hide-tablet')
  if (node.visibility?.hideMobile) classes.push('sb-hide-mobile')

  const styleStr = Object.entries(node.styles)
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')

  let out = ''
  out += attr('id', node.htmlId)
  out += attr('class', classes.join(' ') || undefined)
  out += attr('style', styleStr || undefined)
  out += attr('title', node.htmlTitle)
  out += attr('role', node.accessibility?.role)
  out += attr('aria-label', node.accessibility?.ariaLabel)

  // Links
  if (node.type === 'link' || node.type === 'link-block' || node.tag === 'a') {
    out += attr('href', node.link?.url)
    out += attr('target', node.link?.target)
    out += attr('rel', node.link?.rel)
  }

  // Media
  if (node.type === 'image') {
    out += attr('src', ctx.mediaUrl(ctx.content(node, entry)))
    out += attr('alt', node.accessibility?.altText ?? '')
  }
  if (node.type === 'video') {
    out += attr('src', node.props.src)
    if (node.props.controls !== 'false') out += ' controls'
  }
  if (node.type === 'embed') {
    out += attr('src', node.props.src)
  }

  // Form controls
  if (node.type === 'input') out += attr('type', node.props.type ?? 'text')
  if (node.type === 'checkbox') out += ' type="checkbox"'
  if (node.type === 'radio') out += ' type="radio"'
  if (node.type === 'input' || node.type === 'textarea') {
    out += attr('placeholder', node.props.placeholder)
    out += attr('name', node.props.name)
  }

  // Interactions — the runtime (see interactionsRuntime) reads this and plays them.
  if (node.interactions && node.interactions.length > 0) {
    out += attr('data-sb-ix', JSON.stringify(node.interactions))
  }

  // Custom attributes last (author override).
  if (node.customAttributes) {
    for (const [k, v] of Object.entries(node.customAttributes)) out += attr(k, v)
  }
  return out
}

function isContainer(node: CanvasNode): boolean {
  return CONTAINER_TYPES.includes(node.type)
}

export function renderNodeToHtml(node: CanvasNode, ctx: RenderContext, entry?: Entry): string {
  const tag = node.tag || 'div'

  // Collection list: render the container, repeating its item template per entry.
  if (node.type === 'collection-list') {
    const limit = parseInt(node.props.limit ?? '3', 10) || 3
    const list = ctx.entriesFor(node.props.source, limit)
    const inner = list
      .map((e) => node.children.map((child) => renderNodeToHtml(child, ctx, e)).join(''))
      .join('')
    return `<${tag}${buildAttributes(node, ctx, entry)}>${inner}</${tag}>`
  }

  const attrs = buildAttributes(node, ctx, entry)

  // Void elements — no children/content.
  if (VOID_TAGS.has(tag)) return `<${tag}${attrs} />`

  // Inner content precedence: markdown → children → text.
  let inner: string
  if (node.type === 'markdown') {
    inner = renderMarkdown(ctx.content(node, entry))
  } else if (node.children.length > 0 || isContainer(node)) {
    inner = node.children.map((child) => renderNodeToHtml(child, ctx, entry)).join('')
  } else {
    inner = escapeHtml(ctx.content(node, entry))
  }

  return `<${tag}${attrs}>${inner}</${tag}>`
}
