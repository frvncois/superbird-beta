import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { getCollectionSource } from '@/constants/canvas'
import type { CollectionSource } from '@/types/canvas'

/**
 * Shared selected-node helpers for the settings sidebar blocks.
 * Every block reads the selected node from the canvas store itself,
 * so the blocks stay store-driven (they render twice in EditorView).
 */
export function useNodeSettings() {
  const store = useCanvasStore()
  const node = computed(() => store.selectedNode)

  const isBody = computed(() => node.value?.type === 'body')
  const isTextNode = computed(
    () => !!node.value && ['text', 'heading', 'button'].includes(node.value.type),
  )
  const isImage = computed(() => node.value?.type === 'image')
  const isCollectionList = computed(() => node.value?.type === 'collection-list')

  const isInsideCollection = computed(() => {
    if (!node.value) return false
    if (node.value.type === 'collection-item') return true
    // Walk up to see if inside a collection-item
    let current = store.getParentId(node.value.id)
    while (current) {
      const parent = store.bodyNode.id === current ? store.bodyNode : store.findNode(store.bodyNode.children, current)
      if (parent?.type === 'collection-item') return true
      current = store.getParentId(current)
    }
    return false
  })

  const collectionFields = computed(() => {
    if (!isInsideCollection.value && !isCollectionList.value) return []
    // Find the collection-list ancestor to get the source
    let searchId = node.value?.id
    while (searchId) {
      const n = searchId === store.bodyNode.id ? store.bodyNode : store.findNode(store.bodyNode.children, searchId)
      if (n?.type === 'collection-list') {
        const source = getCollectionSource(n.props.source as CollectionSource)
        return source?.fields ?? []
      }
      searchId = store.getParentId(searchId) ?? undefined
    }
    return []
  })

  const hasFields = computed(() => store.activePageFields.length > 0 || collectionFields.value.length > 0)

  const boundField = computed(() => {
    if (!node.value?.dynamicField) return null
    return store.activePageFields.find((f) => f.key === node.value!.dynamicField)
      ?? collectionFields.value.find((f) => f.key === node.value!.dynamicField)
      ?? null
  })

  return {
    store,
    node,
    isBody,
    isTextNode,
    isImage,
    isCollectionList,
    isInsideCollection,
    collectionFields,
    hasFields,
    boundField,
  }
}
