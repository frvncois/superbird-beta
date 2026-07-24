// Faithful render pipeline: node tree → HTML, style classes → real CSS.
// Pure and framework-free — powers the editor preview and the SSR public runtime.
export { renderNodeToHtml } from './html'
export { compilePageCss, compileSiteCss } from './css'
export { interactionsScript } from './interactionsRuntime'
export { formsRuntimeScript } from './formsRuntime'
export { storefrontRuntimeScript } from './storefrontRuntime'
export { buildRenderContext, resolveNodeContent } from './context'
export type { RenderContext, RenderContextInput, LocaleContext } from './context'

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

// Site-wide chrome from Site Settings (SEO defaults, analytics, custom code,
// favicon). Only the SSR path passes this — the editor Preview omits it, so
// analytics/custom code never fire inside the editor. Media ids are resolved to
// URLs by the caller (it has ctx.mediaUrl); this stays a dumb string emitter.
export interface SiteChrome {
  siteTitle?: string
  faviconUrl?: string
  seo?: {
    titleFormat?: string
    metaDescription?: string
    socialImageUrl?: string
    robotsNoIndex?: boolean
    robotsNoFollow?: boolean
    googleAnalyticsId?: string
    googleTagManagerId?: string
  }
  customCode?: {
    headCode?: string
    bodyStartCode?: string
    bodyEndCode?: string
    customCss?: string
  }
}

// GA/GTM ids are admin-set but still constrained to their real charset so an id
// can't break out of the surrounding <script>.
function analyticsId(id: string | undefined): string {
  return id ? id.replace(/[^A-Za-z0-9\-_]/g, '') : ''
}

// Resolve `%page_title%` / `%site_title%`, then trim any separator left dangling
// when a token resolved empty (e.g. no site title set).
function formatTitle(fmt: string | undefined, pageTitle: string, siteTitle: string): string {
  const out = (fmt || '%page_title%').replace(/%page_title%/g, pageTitle).replace(/%site_title%/g, siteTitle)
  return out.replace(/\s*[|\-–—]\s*$/, '').replace(/^\s*[|\-–—]\s*/, '').trim() || pageTitle
}

function analyticsHeadTags(seo: SiteChrome['seo']): string {
  let out = ''
  const ga = analyticsId(seo?.googleAnalyticsId)
  if (ga) {
    out +=
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script>` +
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');</script>`
  }
  const gtm = analyticsId(seo?.googleTagManagerId)
  if (gtm) {
    out +=
      `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
      `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
      `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})` +
      `(window,document,'script','dataLayer','${gtm}');</script>`
  }
  return out
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
  site: SiteChrome = {},
): string {
  const html = renderNodeToHtml(body, ctx)
  const ixMap = collectInteractions(body)
  const hasIx = Object.keys(ixMap).length > 0
  // The shared runtime also powers forms + the storefront (login/etc.), so it
  // must load on those pages even without interactions.
  const needsScript = hasIx || hasRuntimeNode(body) || !!ctx.systemKey

  let headTags = ''
  const title = head.title ? formatTitle(site.seo?.titleFormat, head.title, site.siteTitle ?? '') : undefined
  if (title) headTags += `<title>${title.replace(/</g, '&lt;')}</title>`
  // Description: page-level wins, else the site-wide SEO default.
  const description = head.description || site.seo?.metaDescription
  if (description) headTags += `<meta name="description" content="${escapeAttr(description)}">`
  // Robots: combine the page's noIndex with the site-wide SEO toggles.
  const noindex = head.noIndex || !!site.seo?.robotsNoIndex
  const nofollow = head.noIndex || !!site.seo?.robotsNoFollow
  if (noindex || nofollow) {
    headTags += `<meta name="robots" content="${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}">`
  }
  if (site.faviconUrl) headTags += `<link rel="icon" href="${escapeAttr(site.faviconUrl)}">`
  // Open Graph / Twitter card — enough for a link preview.
  if (title) headTags += `<meta property="og:title" content="${escapeAttr(title)}">`
  if (description) headTags += `<meta property="og:description" content="${escapeAttr(description)}">`
  if (site.seo?.socialImageUrl) {
    headTags += `<meta property="og:image" content="${escapeAttr(site.seo.socialImageUrl)}">`
    headTags += '<meta name="twitter:card" content="summary_large_image">'
  }
  // Analytics (GA/gtag + GTM) and the author's custom head code / CSS. Custom
  // head/body code is admin-authored and injected verbatim (like WordPress);
  // custom CSS escapes `<` so it can't break out of the <style>.
  headTags += analyticsHeadTags(site.seo)
  if (site.customCode?.headCode) headTags += site.customCode.headCode
  if (site.customCode?.customCss) headTags += `<style>${site.customCode.customCss.replace(/</g, '\\3c ')}</style>`

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

  // GTM needs a <noscript> iframe right after <body>. Custom body-start/end code
  // is admin-authored and injected verbatim.
  const gtm = analyticsId(site.seo?.googleTagManagerId)
  const gtmNoscript = gtm
    ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
    : ''
  const bodyStart = gtmNoscript + (site.customCode?.bodyStartCode ?? '')
  const bodyEnd = site.customCode?.bodyEndCode ?? ''

  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    headTags +
    styleTag +
    `</head><body${bodyAttrs}>${bodyStart}${html}${scriptTag}${bodyEnd}</body></html>`
  )
}

// Any node that the shared runtime needs to wire (a form, or a prebuilt element).
function hasRuntimeNode(node: CanvasNode): boolean {
  if (node.type === 'form' || node.element) return true
  return (node.children ?? []).some(hasRuntimeNode)
}
