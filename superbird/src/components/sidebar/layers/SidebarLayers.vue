<script setup lang="ts">
import { ref, provide } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { CanvasNode } from '@/types/canvas'
import LayerTreeItem from './LayerTreeItem.vue'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import { useContextMenu, buildLayerActions } from '@/composables/useContextMenu'

const store = useCanvasStore()
const dropTarget = ref<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null)
const ctx = useContextMenu()

provide('layerDropTarget', dropTarget)

function handleSelect(id: string, e: MouseEvent) {
  e.stopPropagation()
  store.selectNode(id)
}

function handleContextMenu(e: MouseEvent, node: CanvasNode) {
  store.selectNode(node.id)
  ctx.open(e, buildLayerActions(node))
}

function handleDragStart(e: DragEvent, node: CanvasNode) {
  if (node.type === 'body') {
    e.preventDefault()
    return
  }

  const ghost = document.createElement('div')
  ghost.textContent = node.label
  ghost.style.cssText = `
    position: fixed; top: -100px; left: -100px;
    padding: 4px 10px; border-radius: 8px;
    background: var(--color-foreground); color: var(--color-background);
    font-size: 11px; font-weight: 500; font-family: var(--font-sans);
    white-space: nowrap; pointer-events: none; z-index: 9999;
  `
  document.body.appendChild(ghost)
  e.dataTransfer!.setDragImage(ghost, 0, 0)
  requestAnimationFrame(() => document.body.removeChild(ghost))

  e.stopPropagation()
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('application/superbird-node-id', node.id)
  store.setDraggedNode(node.id)
}

function handleDragEnd() {
  store.setDraggedNode(null)
  dropTarget.value = null
}

function getDropPosition(e: DragEvent, node: CanvasNode): 'before' | 'after' | 'inside' {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const isContainer = ['body', 'container', 'section', 'columns', 'column'].includes(node.type)

  if (node.type === 'body') return 'inside'

  const topZone = 6
  const bottomZone = rect.height - 6

  if (y < topZone) return 'before'
  if (y > bottomZone) return 'after'
  if (isContainer) return 'inside'
  return y < rect.height / 2 ? 'before' : 'after'
}

function handleDragOver(e: DragEvent, node: CanvasNode) {
  e.preventDefault()
  e.stopPropagation()

  const draggedId = e.dataTransfer!.types.includes('application/superbird-node-id')
    ? store.draggedNodeId
    : null
  if (draggedId === node.id) return

  dropTarget.value = { id: node.id, position: getDropPosition(e, node) }
}

function handleDragLeave(e: DragEvent) {
  e.stopPropagation()
  const related = e.relatedTarget as HTMLElement | null
  if (related && (e.currentTarget as HTMLElement).contains(related)) return
  dropTarget.value = null
}

function handleDrop(e: DragEvent, node: CanvasNode) {
  e.preventDefault()
  e.stopPropagation()
  const pos = dropTarget.value?.position
  dropTarget.value = null
  store.setDraggedNode(null)
  if (!pos) return

  const nodeId = e.dataTransfer!.getData('application/superbird-node-id')
  if (nodeId && nodeId !== node.id) {
    store.moveNode(nodeId, node.id, pos)
  }
}
</script>

<template>
  <div class="py-1">
    <LayerTreeItem
      :node="store.bodyNode"
      :depth="0"
      @select="handleSelect"
      @contextmenu-node="handleContextMenu"
      @dragstart-node="handleDragStart"
      @dragend-node="handleDragEnd"
      @dragover-node="handleDragOver"
      @dragleave-node="handleDragLeave"
      @drop-node="handleDrop"
    />

    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />
  </div>
</template>
