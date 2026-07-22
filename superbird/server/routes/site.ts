import { Hono } from 'hono'
import { getInstalledProject, getWorkingDocument, getPublishedDesign } from '../lib/project'
import { renderDocument, type RenderContext } from '@/lib/render'
import type { CanvasNode, Collection, Entry, GlobalStyles, Page, StyleClass } from '@/types/canvas'

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

function buildContext(entries: Entry[], collections: Collection[], activeEntry?: Entry): RenderContext {
  return {
    content(node: CanvasNode, listEntry?: Entry) {
      const e = listEntry ?? activeEntry
      if (e && node.dynamicField) return e.values[node.dynamicField] ?? node.content ?? ''
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
  }
}

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

  const render = (body: CanvasNode, ctx: RenderContext, head: Parameters<typeof renderDocument>[4]) =>
    renderDocument(body, styleClasses, globalStyles, ctx, head)

  const pageHead = (p: Page) => ({
    title: p.seo?.title || p.name,
    description: p.seo?.description,
    noIndex: p.seo?.noIndex,
  })

  const segments = path.split('/').filter(Boolean)

  // Home
  if (segments.length === 0) {
    const home = pages.find((p) => p.slug === '/') ?? pages.find((p) => p.pageType === 'page')
    if (home) return c.html(render(home.body, buildContext(published, collections), pageHead(home)))
  }

  // Static page (single segment)
  if (segments.length === 1) {
    const page = pages.find((p) => p.pageType !== 'collection' && p.slug === segments[0])
    if (page) return c.html(render(page.body, buildContext(published, collections), pageHead(page)))
  }

  // Collection single (two segments: <basePath>/<entry-slug>)
  if (segments.length === 2) {
    const col = collections.find((cl) => cl.basePath === segments[0])
    const template = col ? pages.find((p) => p.id === col.templatePageId) : undefined
    const entry = col ? published.find((e) => e.collectionId === col.id && e.slug === segments[1]) : undefined
    if (col && template && entry) {
      return c.html(render(template.body, buildContext(published, collections, entry), { title: entry.title }))
    }
  }

  // 404
  const notFound = pages.find((p) => p.pageType === 'system' && p.slug === '404')
  const html = notFound
    ? render(notFound.body, buildContext(published, collections), { title: '404' })
    : placeholder('Page not found.')
  return c.html(html, 404)
})

export default site
