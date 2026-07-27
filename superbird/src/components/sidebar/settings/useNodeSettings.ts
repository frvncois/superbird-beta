import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import type { CollectionField } from '@/types/canvas'

/**
 * Shared selected-node helpers for the settings sidebar blocks.
 * Every block reads the selected node from the canvas store itself,
 * so the blocks stay store-driven (they render twice in EditorView).
 */
export function useNodeSettings() {
  const store = useCanvasStore()
  const collections = useCollectionsStore()
  const node = computed(() => store.selectedNode)

  const isBody = computed(() => node.value?.type === 'body')
  const isTextNode = computed(
    () => !!node.value && ['text', 'heading', 'button'].includes(node.value.type),
  )
  const isImage = computed(() => node.value?.type === 'image')
  const isCollectionList = computed(() => node.value?.type === 'collection-list')
  // Only link-ish elements get a Link section (a URL editor makes no sense on a
  // plain div/text). Matches the renderer's isLinked types.
  const isLinkable = computed(
    () => !!node.value && ['button', 'link'].includes(node.value.type),
  )

  // Fields of the collection currently being edited (derived from the template's
  // placed dynamic-field elements). Empty on a regular page.
  const schemaFields = computed<CollectionField[]>(() =>
    store.isCollectionTemplate ? collections.schemaFor(store.activePage.body) : [],
  )
  const hasFields = computed(() => schemaFields.value.length > 0)

  // The field a selected element is bound to (a dynamic-field node).
  const boundField = computed<CollectionField | null>(() => {
    if (!node.value?.dynamicField) return null
    return schemaFields.value.find((f) => f.key === node.value!.dynamicField)
      ?? { key: node.value.dynamicField, label: node.value.label, type: node.value.type === 'image' ? 'image' : 'text' }
  })

  return {
    store,
    node,
    isBody,
    isTextNode,
    isImage,
    isCollectionList,
    isLinkable,
    schemaFields,
    hasFields,
    boundField,
  }
}
