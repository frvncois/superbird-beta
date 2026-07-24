import type { CanvasNode, Collection, Entry, SystemPageKey } from '@/types/canvas'

// The data the pure renderer needs, abstracted from its source. Built from the
// stores in the editor (preview); from the DB in the SSR runtime (Task 3).
export interface RenderContext {
  // Resolve a node's text content. `entry` is set when rendering a
  // collection-list item so field-bound nodes read that entry's values.
  content(node: CanvasNode, entry?: Entry): string
  // Media id → URL ('' when unavailable).
  mediaUrl(id: string): string
  // Entries to expand a collection-list (source = collection id, capped).
  entriesFor(source: string | undefined, limit: number): Entry[]
  // The public URL of an entry's single page (/<basePath>/<slug>).
  entryUrl(entry: Entry): string
  // The active entry when rendering a collection single page (so a top-level
  // node bound to "current post" resolves). Collection-list items pass their
  // own entry down and don't need this.
  currentEntry?: Entry
  // Set when rendering a store system page — surfaces its role to the runtime
  // (body[data-sb-system]) and switches forms to the storefront wiring.
  systemKey?: SystemPageKey
  // Set on a single product page (products-collection entry) so the storefront
  // runtime knows which product an add-to-cart control refers to.
  productEntryId?: string
  // The active locale + available locales, for the lang-switcher element and
  // locale-aware content resolution on the published site.
  locale?: string
  locales?: { code: string; label: string }[]
}

// The single source of truth for resolving a node's display text:
//   entry value (field-bound) → locale translation → authored content.
// The editor store (getNodeContent), the SSR context, and the Preview context
// all route through this so they can't drift apart.
export function resolveNodeContent(
  node: CanvasNode,
  opts: { entry?: Entry; locale?: string; defaultLocale?: string } = {},
): string {
  if (opts.entry && node.dynamicField) {
    return opts.entry.values[node.dynamicField] ?? node.content ?? ''
  }
  if (opts.locale && opts.defaultLocale && opts.locale !== opts.defaultLocale) {
    return node.translations?.[opts.locale] ?? node.content ?? ''
  }
  return node.content ?? ''
}

export interface LocaleContext {
  locale: string
  defaultLocale: string
  locales: { code: string; label: string }[]
}

export interface RenderContextInput {
  entries: Entry[]
  collections: Collection[]
  mediaUrl: (id: string) => string
  // Active entry on a collection-single page (resolves top-level "current post").
  activeEntry?: Entry
  locale?: LocaleContext
  // Preview passes true (authoring aid); SSR passes false (only published go live).
  includeDrafts?: boolean
}

// One factory for the pure RenderContext, shared by SSR (site.ts) and the editor
// Preview. Centralises content resolution, the collection-list published filter +
// 0–100 limit clamp, and entry-URL building so the two paths stay in lockstep.
export function buildRenderContext(input: RenderContextInput): RenderContext {
  const { entries, collections, mediaUrl, activeEntry, locale, includeDrafts = false } = input
  return {
    content(node: CanvasNode, listEntry?: Entry) {
      return resolveNodeContent(node, {
        entry: listEntry ?? activeEntry,
        locale: locale?.locale,
        defaultLocale: locale?.defaultLocale,
      })
    },
    mediaUrl,
    entriesFor(source: string | undefined, limit: number): Entry[] {
      const col = collections.find((c) => c.id === source)
      if (!col) return []
      const clamped = Math.min(100, Math.max(0, limit))
      return entries
        .filter((e) => e.collectionId === col.id && (includeDrafts || e.status === 'published'))
        .slice(0, clamped)
    },
    entryUrl(entry: Entry): string {
      const col = collections.find((c) => c.id === entry.collectionId)
      return col ? `/${col.basePath}/${entry.slug}` : '#'
    },
    currentEntry: activeEntry,
    locale: locale?.locale,
    locales: locale?.locales,
  }
}
