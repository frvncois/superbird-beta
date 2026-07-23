import { ref, computed, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useUserComponentsStore } from '@/stores/userComponents'
import { CONTAINER_TYPES } from '@/constants/canvas'
import type { CanvasNode, FieldType, PrebuiltElementKey } from '@/types/canvas'

/**
 * Drag & drop behavior for a canvas node: acting as a drag source (reorder)
 * and as a drop target for new components, dynamic fields, user components,
 * and existing-node reordering.
 */
export function useNodeDnD(node: Ref<CanvasNode>) {
  const store = useCanvasStore()
  const componentsStore = useUserComponentsStore()

  const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

  const isBody = computed(() => node.value.type === 'body')
  const isContainer = computed(() => CONTAINER_TYPES.includes(node.value.type))

  // --- Drag source (reorder) ---

  function handleDragStart(e: DragEvent) {
    if (isBody.value) {
      e.preventDefault()
      return
    }
    e.stopPropagation()
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('application/superbird-node-id', node.value.id)
  }

  // --- Drop target ---

  function getDropPosition(e: DragEvent): 'before' | 'after' | 'inside' {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const threshold = rect.height * 0.25

    if (isContainer.value && y > threshold && y < rect.height - threshold) {
      return 'inside'
    }
    return y < rect.height / 2 ? 'before' : 'after'
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer!.dropEffect = 'move'
    dropPosition.value = getDropPosition(e)
  }

  function handleDragLeave(e: DragEvent) {
    e.stopPropagation()
    dropPosition.value = null
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const pos = dropPosition.value
    dropPosition.value = null

    if (!pos) return

    // Dropping a new component from sidebar
    const componentType = e.dataTransfer!.getData('application/superbird-component')
    if (componentType) {
      store.addNode(
        componentType as any,
        {},
        node.value.id,
        pos,
      )
      store.setDraggedComponent(null)
      return
    }

    // Dropping a prebuilt "Dynamic" element (login/cart) → inserts its tree
    const prebuilt = e.dataTransfer!.getData('application/superbird-prebuilt')
    if (prebuilt) {
      store.addPrebuilt(prebuilt as PrebuiltElementKey, node.value.id, pos)
      return
    }

    // Dropping a typed dynamic field from the Elements tab → creates a new field
    const fieldType = e.dataTransfer!.getData('application/superbird-dynamic-field')
    if (fieldType) {
      store.addDynamicField(fieldType as FieldType, node.value.id, pos)
      return
    }

    // Dropping a user component from sidebar
    const userCompId = e.dataTransfer!.getData('application/superbird-user-component')
    if (userCompId) {
      componentsStore.addComponentToPage(userCompId, node.value.id, pos)
      return
    }

    // Reordering existing node
    const nodeId = e.dataTransfer!.getData('application/superbird-node-id')
    if (nodeId && nodeId !== node.value.id) {
      store.moveNode(nodeId, node.value.id, pos)
    }
  }

  return {
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
