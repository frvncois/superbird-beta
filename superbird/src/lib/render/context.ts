import type { CanvasNode, Entry } from '@/types/canvas'

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
}
