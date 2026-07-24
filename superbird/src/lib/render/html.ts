import type { CanvasNode, Entry } from '@/types/canvas'
import { CONTAINER_TYPES } from '@/constants/canvas'
import { renderMarkdown } from '@/lib/markdown'
import { escapeHtml, escapeAttr, isSafeAttrName, safeUrl } from './escape'
import type { RenderContext } from './context'

// Node tree → faithful HTML. Real elements (img/a/form controls), resolved
// content/media/links, no editor chrome. Framework-free so the SSR runtime can
// reuse it verbatim. Responsive-visibility (sb-hide-* classes) and interaction
// hooks (data-sb-ix) are emitted here; the runtime + CSS handle playback.

const VOID_TAGS = new Set(['img', 'input', 'br', 'hr', 'source', 'area', 'base', 'col', 'meta', 'wbr'])

function attr(name: string, value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return ''
  return ` ${name}="${escapeAttr(value)}"`
}

function buildAttributes(
  node: CanvasNode,
  ctx: RenderContext,
  entry: Entry | undefined,
  repeated: boolean,
): string {
  const classes = [...node.classes]
  if (node.advanced?.customCssClass) classes.push(node.advanced.customCssClass)
  // Responsive visibility
  if (node.visibility?.hideDesktop) classes.push('sb-hide-desktop')
  if (node.visibility?.hideTablet) classes.push('sb-hide-tablet')
  if (node.visibility?.hideMobile) classes.push('sb-hide-mobile')

  let out = ''
  // A user-set DOM id must be unique — never emit it on repeated collection
  // items (it would produce duplicate ids across every row).
  out += attr('id', repeated ? undefined : node.htmlId)
  out += attr('class', classes.join(' ') || undefined)
  // Styling comes from per-element CSS keyed to this attribute (compilePageCss),
  // resolved identically to the editor canvas.
  if (node.classes.length > 0 || Object.keys(node.styles).length > 0) {
    out += attr('data-sb-s', node.id)
  }
  out += attr('title', node.htmlTitle)
  out += attr('role', node.accessibility?.role)
  out += attr('aria-label', node.accessibility?.ariaLabel)

  // Links — anchors, link blocks, and linked buttons (rendered as <a>).
  if (isLinked(node)) {
    out += attr('href', linkHref(node, ctx, entry))
    out += attr('target', node.link?.target)
    out += attr('rel', node.link?.rel)
  }

  // Media
  if (node.type === 'image') {
    out += attr('src', ctx.mediaUrl(ctx.content(node, entry)))
    out += attr('alt', node.accessibility?.altText ?? '')
  }
  if (node.type === 'video') {
    out += attr('src', safeUrl(node.props.src))
    if (node.props.controls !== 'false') out += ' controls'
  }
  if (node.type === 'embed') {
    out += attr('src', safeUrl(node.props.src))
  }

  // Prebuilt "Dynamic" element → the storefront runtime wires its action.
  if (node.element) out += attr('data-sb-el', node.element)
  // Add-to-cart: emit the runtime's click hook, bound to the product being
  // rendered (collection-list item → the current entry; product single →
  // ctx.currentEntry/productEntryId). Emitted even with no id — the runtime then
  // falls back to the nearest [data-sb-entry] host — so the attribute is bare
  // rather than dropped (attr() would omit an empty value).
  if (node.element === 'add-to-cart') {
    const entryId = entry?.id ?? ctx.currentEntry?.id ?? ctx.productEntryId
    out += entryId ? attr('data-sb-add-to-cart', entryId) : ' data-sb-add-to-cart'
  }

  // Form controls. On a system page the form is wired by the storefront runtime
  // (login/etc.), and a prebuilt-element form (login) has its own marker — so
  // neither gets the generic form-submission marker.
  if (node.type === 'form' && !ctx.systemKey && !node.element) out += attr('data-sb-form', node.id)
  if (node.type === 'input') out += attr('type', node.props.type ?? 'text')
  if (node.type === 'checkbox') out += ' type="checkbox"'
  if (node.type === 'radio') out += ' type="radio"'
  if (node.type === 'input' || node.type === 'textarea') {
    out += attr('placeholder', node.props.placeholder)
    out += attr('name', node.props.name)
  }

  // Interactions — the element only carries its node id here; the actual
  // interaction data lives in the script (window.__SB_IX__), keyed by this id,
  // so the markup stays clean. The runtime (interactionsRuntime) wires them up.
  if (node.interactions && node.interactions.length > 0) {
    out += attr('data-sb-ix', node.id)
  }

  // Custom attributes last (author override). Skip invalid keys so a malformed
  // key can't inject extra attributes/handlers into the tag.
  if (node.customAttributes) {
    for (const [k, v] of Object.entries(node.customAttributes)) {
      if (isSafeAttrName(k)) out += attr(k, v)
    }
  }
  return out
}

function isContainer(node: CanvasNode): boolean {
  return CONTAINER_TYPES.includes(node.type)
}

// A node carries a link if a url or "current post" is set.
function hasLink(node: CanvasNode): boolean {
  return !!(node.link && (node.link.url || node.link.currentEntry))
}

// Which nodes render as anchors: real links/link-blocks, any <a>, and buttons
// that have a link (so the button navigates).
function isLinked(node: CanvasNode): boolean {
  return (
    node.type === 'link' ||
    node.type === 'link-block' ||
    node.tag === 'a' ||
    (node.type === 'button' && hasLink(node))
  )
}

// Resolve a node's href, including "current post" → the entry's URL.
function linkHref(node: CanvasNode, ctx: RenderContext, entry: Entry | undefined): string | undefined {
  if (node.link?.currentEntry) {
    const e = entry ?? ctx.currentEntry
    return e ? ctx.entryUrl(e) : undefined
  }
  // Author-set URL — allow only safe schemes (no javascript:/data:/…).
  return safeUrl(node.link?.url)
}

// Cap recursion so a maliciously deep (or huge) published tree can't stack-
// overflow the public SSR request. Real content is nowhere near this.
const MAX_DEPTH = 64

export function renderNodeToHtml(node: CanvasNode, ctx: RenderContext, entry?: Entry, repeated = false, depth = 0): string {
  if (depth > MAX_DEPTH) return ''
  // A linked button becomes an <a> so it actually navigates.
  const tag = node.type === 'button' && hasLink(node) ? 'a' : node.tag || 'div'

  // Collection list: render the container, repeating its item template per entry.
  // Items are `repeated` so their author-set htmlIds aren't duplicated per row.
  if (node.type === 'collection-list') {
    const limit = Math.min(100, Math.max(0, parseInt(node.props.limit ?? '3', 10) || 3))
    const list = ctx.entriesFor(node.props.source, limit)
    const inner = list
      .map((e) => node.children.map((child) => renderNodeToHtml(child, ctx, e, true, depth + 1)).join(''))
      .join('')
    return `<${tag}${buildAttributes(node, ctx, entry, repeated)}>${inner}</${tag}>`
  }

  const attrs = buildAttributes(node, ctx, entry, repeated)

  // Lang switcher: generate a link per available locale (?lang=<code>). Works
  // without JS — the server reads ?lang and persists it in a cookie.
  if (node.element === 'lang-switcher') {
    const locales = ctx.locales ?? []
    const inner = locales
      .map((l) => {
        const current = l.code === ctx.locale ? ' aria-current="true"' : ''
        return `<a href="?lang=${encodeURIComponent(l.code)}"${current}>${escapeHtml(l.label)}</a>`
      })
      .join('')
    return `<${tag}${attrs}>${inner}</${tag}>`
  }

  // Void elements — no children/content.
  if (VOID_TAGS.has(tag)) return `<${tag}${attrs} />`

  // Inner content precedence: markdown → children → text.
  let inner: string
  if (node.type === 'markdown') {
    inner = renderMarkdown(ctx.content(node, entry))
  } else if (node.children.length > 0 || isContainer(node)) {
    inner = node.children.map((child) => renderNodeToHtml(child, ctx, entry, repeated, depth + 1)).join('')
  } else {
    inner = escapeHtml(ctx.content(node, entry))
  }

  // Honeypot: an off-screen field the forms runtime + server use to drop bots.
  if (node.type === 'form') inner += FORM_HONEYPOT

  return `<${tag}${attrs}>${inner}</${tag}>`
}

const FORM_HONEYPOT =
  '<input type="text" name="_sb_hp" tabindex="-1" autocomplete="off" aria-hidden="true"' +
  ' style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />'
