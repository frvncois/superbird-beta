import { ref } from 'vue'
import { defineStore } from 'pinia'
import { generateCollectionId, generateEntryId } from '@/lib/ids'
import { walkTree } from '@/lib/tree'
import { demoCollections, demoEntries } from '@/data/demo'
import type { CanvasNode, Collection, CollectionField, Entry, FieldType } from '@/types/canvas'

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * User-defined content types (collections) and their entries — in-app only
 * (no persistence yet). Standalone data store: it imports no other store, so
 * the graph stays acyclic. Collection *creation* is orchestrated by the UI
 * (which also creates the template page via the canvas store).
 */
export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<Collection[]>(demoCollections)
  const entries = ref<Entry[]>(demoEntries)

  // --- Reads ---

  function collectionById(id: string | null | undefined): Collection | undefined {
    if (!id) return undefined
    return collections.value.find((c) => c.id === id)
  }

  function collectionByTemplatePage(pageId: string): Collection | undefined {
    return collections.value.find((c) => c.templatePageId === pageId)
  }

  function entryById(id: string | null | undefined): Entry | undefined {
    if (!id) return undefined
    return entries.value.find((e) => e.id === id)
  }

  function entriesByCollection(collectionId: string): Entry[] {
    return entries.value.filter((e) => e.collectionId === collectionId)
  }

  /**
   * Derive a collection's schema from its template body — the dynamic-field
   * nodes placed on the canvas. `body` is passed in (from the canvas store) so
   * this store imports no other store.
   */
  function schemaFor(body: CanvasNode): CollectionField[] {
    const fields: CollectionField[] = []
    const seen = new Set<string>()
    walkTree(body, (node) => {
      if (node.dynamicField && !seen.has(node.dynamicField)) {
        seen.add(node.dynamicField)
        fields.push({ key: node.dynamicField, label: node.label, type: fieldTypeFromNode(node) })
      }
    })
    return fields
  }

  // --- Collections CRUD ---

  function addCollection(input: { name: string; templatePageId: string }): Collection {
    const singular = input.name.replace(/s$/, '')
    const collection: Collection = {
      id: generateCollectionId(),
      name: input.name,
      singular,
      plural: input.name,
      basePath: slugify(input.name),
      templatePageId: input.templatePageId,
    }
    collections.value.push(collection)
    return collection
  }

  function renameCollection(id: string, name: string) {
    const c = collectionById(id)
    if (c) { c.name = name; c.plural = name; c.singular = name.replace(/s$/, ''); c.basePath = slugify(name) }
  }

  function removeCollection(id: string) {
    collections.value = collections.value.filter((c) => c.id !== id)
    entries.value = entries.value.filter((e) => e.collectionId !== id)
  }

  // --- Entries CRUD ---

  function addEntry(collectionId: string): Entry {
    const collection = collectionById(collectionId)
    const count = entriesByCollection(collectionId).length + 1
    const title = `${collection?.singular ?? 'Item'} ${count}`
    const entry: Entry = {
      id: generateEntryId(),
      collectionId,
      title,
      slug: slugify(title),
      status: 'draft',
      values: {},
    }
    entries.value.push(entry)
    return entry
  }

  function updateEntry(id: string, patch: Partial<Pick<Entry, 'title' | 'slug' | 'status'>>) {
    const e = entryById(id)
    if (!e) return
    Object.assign(e, patch)
  }

  function setEntryValue(entryId: string, key: string, value: string) {
    const e = entryById(entryId)
    if (!e) return
    e.values[key] = value
  }

  function removeEntry(id: string) {
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return {
    collections,
    entries,
    collectionById,
    collectionByTemplatePage,
    entryById,
    entriesByCollection,
    schemaFor,
    addCollection,
    renameCollection,
    removeCollection,
    addEntry,
    updateEntry,
    setEntryValue,
    removeEntry,
  }
})

// --- helpers ---

function fieldTypeFromNode(node: CanvasNode): FieldType {
  if (node.type === 'image') return 'image'
  const ft = node.props.fieldType as FieldType | undefined
  return ft ?? 'text'
}
