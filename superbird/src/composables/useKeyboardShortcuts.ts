import { onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { CONTAINER_TYPES } from '@/constants/canvas'
import { useHistory } from './useHistory'

export function useKeyboardShortcuts() {
  const store = useCanvasStore()
  const { undo, redo } = useHistory()

  function isInputFocused(): boolean {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable
  }

  function handleKeydown(e: KeyboardEvent) {
    const isMeta = e.metaKey || e.ctrlKey

    // Cmd+Z / Cmd+Shift+Z — undo/redo (works even in inputs)
    if (isMeta && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
      return
    }

    if (isInputFocused()) return

    const selectedId = store.selectedNodeId
    const selectedNode = store.selectedNode

    // Escape — deselect
    if (e.key === 'Escape') {
      e.preventDefault()
      store.selectNode(null)
      return
    }

    if (!selectedId || !selectedNode) return

    // Delete / Backspace — remove selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNode.type === 'body') return
      e.preventDefault()
      store.removeNode(selectedId)
      return
    }

    // Cmd+C — copy
    if (isMeta && e.key === 'c') {
      if (selectedNode.type === 'body') return
      e.preventDefault()
      store.copyNode(selectedId)
      return
    }

    // Cmd+V — paste inside selected (or after if not container)
    if (isMeta && e.key === 'v') {
      if (!store.clipboardNode) return
      e.preventDefault()
      const isContainer = CONTAINER_TYPES.includes(selectedNode.type)
      store.pasteNode(selectedId, isContainer ? 'inside' : 'after')
      return
    }

    // Cmd+D — duplicate
    if (isMeta && e.key === 'd') {
      if (selectedNode.type === 'body') return
      e.preventDefault()
      store.duplicateNode(selectedId)
      return
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
