import { Hono } from 'hono'
import { getInstalledProject, getWorkingDocument, getPublishedDesign } from '../lib/project'
import {
  renderDocument,
  compileSiteCss,
  collectInteractions,
  interactionsScript,
  formsRuntimeScript,
  storefrontRuntimeScript,
  type RenderContext,
} from '@/lib/render'
import { currentCustomer } from '../lib/customerSession'
import { getCookie, setCookie } from 'hono/cookie'
import type { CanvasNode, Collection, Entry, GlobalStyles, Page, StyleClass } from '@/types/canvas'

// Shared external asset paths (linked from every page).
const STYLE_HREF = '/style.css'
const SCRIPT_SRC = '/script.js'

// The public face: resolves a URL to a page (or a collection template + entry)
// and renders it with the shared pipeline. Serves the PUBLISHED design + LIVE
// entries filtered to status:published. Media is not persisted yet, so <img>
// src resolves empty for now.

const site = new Hono()

function placeholder(message: string): string {
  return (
    '<!doctype html><meta charset="utf-8">' +
    '<div style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;color:#475569;text-align:center">' +
    `<div><h1 style="font-weight:600;margin:0 0 .5rem">Superbird</h1><p>${message}</p></div></div>`
  )
}

interface LocaleCtx {
  locale: string
  defaultLocale: string
  locales: { code: string; label: string }[]
}

function buildContext(entries: Entry[], collections: Collection[], activeEntry?: Entry, loc?: LocaleCtx): RenderContext {
  return {
    content(node: CanvasNode, listEntry?: Entry) {
      const e = listEntry ?? activeEntry
      if (e && node.dynamicField) return e.values[node.dynamicField] ?? node.content ?? ''
      // Non-default locale → prefer the node's translation for that locale.
      if (loc && loc.locale !== loc.defaultLocale) return node.translations?.[loc.locale] ?? node.content ?? ''
      return node.content ?? ''
    },
    mediaUrl(id: string) {
      // Deterministic served path; the /media/:id route streams the file.
      return id ? `/media/${id}` : ''
    },
    entriesFor(source: string | undefined, limit: number): Entry[] {
      const col = collections.find((c) => c.id === source)
      if (!col) return []
      // `entries` is already published-filtered.
      return entries.filter((e) => e.collectionId === col.id).slice(0, limit)
    },
    entryUrl(entry: Entry): string {
      const col = collections.find((c) => c.id === entry.collectionId)
      return col ? `/${col.basePath}/${entry.slug}` : '#'
    },
    currentEntry: activeEntry,
    locale: loc?.locale,
    locales: loc?.locales,
  }
}

// The published design (pages + styles), or null if not installed/published.
function loadDesign():
  | { pages: Page[]; styleClasses: Record<string, StyleClass>; globalStyles: GlobalStyles }
  | null {
  const proj = getInstalledProject()
  if (!proj) return null
  const design = getPublishedDesign(proj.id)
  if (!design) return null
  return {
    pages: (design.pages ?? []) as Page[],
    styleClasses: (design.styleClasses ?? {}) as Record<string, StyleClass>,
    globalStyles: design.globalStyles as GlobalStyles,
  }
}

// One shared stylesheet for the whole site (element rules are node-id scoped).
site.get('/style.css', (c) => {
  const design = loadDesign()
  if (!design) return c.body('', 404)
  const css = compileSiteCss(
    design.pages.map((p) => p.body),
    design.styleClasses,
    design.globalStyles,
  )
  return new Response(css, {
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
})

// One shared script: the interaction runtime + every page's interaction data.
site.get('/script.js', (c) => {
  const design = loadDesign()
  if (!design) return c.body('', 404)
  const map: Record<string, unknown> = {}
  for (const p of design.pages) Object.assign(map, collectInteractions(p.body))
  return new Response(interactionsScript(map) + formsRuntimeScript() + storefrontRuntimeScript(), {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
})

site.get('*', (c) => {
  const path = c.req.path
  if (path.startsWith('/api')) return c.json({ error: 'Not found' }, 404)
  // /admin is the admin SPA's namespace — never a public page. In production
  // the built admin app is served here; in dev it lives on the Vite server.
  if (path === '/admin' || path.startsWith('/admin/')) {
    return c.html(placeholder('The admin app runs on the Vite dev server at /admin.'), 404)
  }

  const proj = getInstalledProject()
  if (!proj) return c.html(placeholder('This site has not been set up yet.'))

  const design = getPublishedDesign(proj.id)
  if (!design) return c.html(placeholder('This site hasn’t been published yet.'))

  const pages = (design.pages ?? []) as Page[]
  const styleClasses = (design.styleClasses ?? {}) as Record<string, StyleClass>
  const globalStyles = design.globalStyles as GlobalStyles

  const working = getWorkingDocument(proj.id)
  const collections = (working?.content.collections ?? []) as Collection[]
  const published = ((working?.content.entries ?? []) as Entry[]).filter((e) => e.status === 'published')

  // Locale: ?lang wins (and is remembered in a cookie), else the cookie, else
  // the site default. Only codes the site actually has are accepted.
  const localesConfig = (design as { locales?: { locales?: { code: string; label: string }[]; defaultLocale?: string } }).locales
  const availableLocales = (localesConfig?.locales ?? []).map((l) => ({ code: l.code, label: l.label }))
  const defaultLocale = localesConfig?.defaultLocale ?? availableLocales[0]?.code ?? 'en'
  const isValidLocale = (code?: string) => !!code && availableLocales.some((l) => l.code === code)
  let locale = defaultLocale
  const langParam = c.req.query('lang')
  if (isValidLocale(langParam)) {
    locale = langParam!
    setCookie(c, 'sb_lang', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' })
  } else if (isValidLocale(getCookie(c, 'sb_lang'))) {
    locale = getCookie(c, 'sb_lang')!
  }
  const localeCtx = { locale, defaultLocale, locales: availableLocales }

  const render = (body: CanvasNode, ctx: RenderContext, head: Parameters<typeof renderDocument>[4]) =>
    renderDocument(body, styleClasses, globalStyles, ctx, head, {
      styleHref: STYLE_HREF,
      scriptSrc: SCRIPT_SRC,
    })

  const pageHead = (p: Page) => ({
    title: p.seo?.title || p.name,
    description: p.seo?.description,
    noIndex: p.seo?.noIndex,
  })

  const segments = path.split('/').filter(Boolean)

  // Home
  if (segments.length === 0) {
    const home = pages.find((p) => p.slug === '/') ?? pages.find((p) => p.pageType === 'page')
    if (home) return c.html(render(home.body, buildContext(published, collections, undefined, localeCtx), pageHead(home)))
  }

  // Static page (single segment) — incl. store system pages by slug.
  if (segments.length === 1) {
    const page = pages.find((p) => p.pageType !== 'collection' && p.slug === segments[0])
    if (page) {
      // Customer-auth gating for the store's system pages.
      if (page.systemKey === 'account' && !currentCustomer(c)) return c.redirect('/login')
      if (page.systemKey === 'login' && currentCustomer(c)) return c.redirect('/account')
      const ctx = buildContext(published, collections, undefined, localeCtx)
      ctx.systemKey = page.systemKey
      return c.html(render(page.body, ctx, pageHead(page)))
    }
  }

  // Collection single (two segments: <basePath>/<entry-slug>)
  if (segments.length === 2) {
    const col = collections.find((cl) => cl.basePath === segments[0])
    const template = col ? pages.find((p) => p.id === col.templatePageId) : undefined
    const entry = col ? published.find((e) => e.collectionId === col.id && e.slug === segments[1]) : undefined
    if (col && template && entry) {
      const ctx = buildContext(published, collections, entry, localeCtx)
      // Products-collection single → expose the entry id for add-to-cart.
      if ((col as Collection & { isProducts?: boolean }).isProducts) ctx.productEntryId = entry.id
      return c.html(render(template.body, ctx, { title: entry.title }))
    }
  }

  // 404
  const notFound = pages.find((p) => p.pageType === 'system' && p.slug === '404')
  const html = notFound
    ? render(notFound.body, buildContext(published, collections, undefined, localeCtx), { title: '404' })
    : placeholder('Page not found.')
  return c.html(html, 404)
})

export default site
