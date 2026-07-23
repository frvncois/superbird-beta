import type { CanvasNode, Entry, SystemPageKey } from '@/types/canvas'

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
}
