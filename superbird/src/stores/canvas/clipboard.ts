import { ref, type ComputedRef, type Ref } from 'vue'
import { findNode, findParent, findParentNode } from '@/lib/tree'
import { createNode, deepCloneNode } from '@/lib/nodeFactory'
import { CONTAINER_TYPES } from '@/constants/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import type { CanvasNode, Page } from '@/types/canvas'

// Clipboard + structural node operations (copy/paste, duplicate, wrap/unwrap,
// reorder, class copy/paste, tree queries), extracted from the canvas store.
// Shares the store's `activePage` + `selectedNodeId`; spread into the store's
// return so `store.copyNode` etc. and history (pages deep watch) are unchanged.
export function useClipboardOps(activePage: ComputedRef<Page>, selectedNodeId: Ref<string | null>) {
  const globalStylesStore = useGlobalStylesStore()
  const clipboardNode = ref<CanvasNode | null>(null)
  const clipboardClasses = ref<string[]>([])

  function copyNode(id: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node || node.type === 'body') return
    clipboardNode.value = deepCloneNode(node)
  }

  function pasteNode(targetId: string, position: 'before' | 'after' | 'inside') {
    if (!clipboardNode.value) return
    const clone = deepCloneNode(clipboardNode.value)
    const body = activePage.value.body

    if (position === 'inside') {
      const target = targetId === body.id ? body : findNode(body.children, targetId)
      if (target) {
        target.children.push(clone)
        selectedNodeId.value = clone.id
        return
      }
    }

    const result = findParent(body.children, targetId)
    if (result) {
      const idx = position === 'after' ? result.index + 1 : result.index
      result.parent.splice(idx, 0, clone)
      selectedNodeId.value = clone.id
    }
  }

  function duplicateNode(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result) return
    const original = result.parent[result.index]!
    const clone = deepCloneNode(original)
    result.parent.splice(result.index + 1, 0, clone)
    selectedNodeId.value = clone.id
  }

  function wrapInContainer(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result) return
    const node = result.parent[result.index]!
    const container = createNode('container', { children: [node] })
    result.parent[result.index] = container
    selectedNodeId.value = container.id
  }

  function unwrapNode(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const node = findNode(body.children, id)
    if (!node || node.children.length === 0) return
    const isContainer = ['container', 'section', 'columns', 'column'].includes(node.type)
    if (!isContainer) return

    const result = findParent(body.children, id)
    if (!result) return
    const children = [...node.children]
    result.parent.splice(result.index, 1, ...children)
    selectedNodeId.value = children[0]?.id ?? null
  }

  function moveUp(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result || result.index === 0) return
    const [node] = result.parent.splice(result.index, 1)
    result.parent.splice(result.index - 1, 0, node!)
  }

  function moveDown(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result || result.index >= result.parent.length - 1) return
    const [node] = result.parent.splice(result.index, 1)
    result.parent.splice(result.index + 1, 0, node!)
  }

  function copyClasses(id: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    clipboardClasses.value = [...node.classes]
  }

  function pasteClasses(id: string) {
    if (clipboardClasses.value.length === 0) return
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    for (const cls of clipboardClasses.value) {
      if (!node.classes.includes(cls)) {
        if (!globalStylesStore.styleClasses[cls]) globalStylesStore.createStyleClass(cls)
        node.classes.push(cls)
      }
    }
  }

  function getNodeIndex(id: string): { index: number; total: number } | null {
    const body = activePage.value.body
    const result = findParent(body.children, id)
    if (!result) return null
    return { index: result.index, total: result.parent.length }
  }

  function isContainerNode(id: string): boolean {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return false
    return CONTAINER_TYPES.includes(node.type)
  }

  function getParentId(id: string): string | null {
    const body = activePage.value.body
    if (id === body.id) return null
    return findParentNode(body, id)?.id ?? null
  }

  return {
    clipboardNode,
    clipboardClasses,
    copyNode,
    pasteNode,
    duplicateNode,
    wrapInContainer,
    unwrapNode,
    moveUp,
    moveDown,
    copyClasses,
    pasteClasses,
    getNodeIndex,
    isContainerNode,
    getParentId,
  }
}
