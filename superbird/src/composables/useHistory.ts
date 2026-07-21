import { ref, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const MAX_HISTORY = 50

interface Snapshot {
  pages: string
  styleClasses: string
  userComponents: string
}

export function useHistory() {
  const store = useCanvasStore()
  const undoStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])
  const paused = ref(false)

  function takeSnapshot(): Snapshot {
    return {
      pages: JSON.stringify(store.pages),
      styleClasses: JSON.stringify(store.styleClasses),
      userComponents: JSON.stringify(store.userComponents),
    }
  }

  function applySnapshot(snapshot: Snapshot) {
    paused.value = true
    store.pages.splice(0, store.pages.length, ...JSON.parse(snapshot.pages))
    Object.keys(store.styleClasses).forEach((k) => delete store.styleClasses[k])
    Object.assign(store.styleClasses, JSON.parse(snapshot.styleClasses))
    Object.keys(store.userComponents).forEach((k) => delete store.userComponents[k])
    Object.assign(store.userComponents, JSON.parse(snapshot.userComponents))

    // Re-validate active page
    if (!store.pages.find((p) => p.id === store.activePageId)) {
      store.setActivePage(store.pages[0]?.id ?? '')
    }

    requestAnimationFrame(() => { paused.value = false })
  }

  function pushState() {
    if (paused.value) return
    undoStack.value.push(takeSnapshot())
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    if (undoStack.value.length === 0) return
    redoStack.value.push(takeSnapshot())
    const snapshot = undoStack.value.pop()!
    applySnapshot(snapshot)
  }

  function redo() {
    if (redoStack.value.length === 0) return
    undoStack.value.push(takeSnapshot())
    const snapshot = redoStack.value.pop()!
    applySnapshot(snapshot)
  }

  const canUndo = ref(false)
  const canRedo = ref(false)

  // Watch stacks to update flags
  watch(() => undoStack.value.length, (len) => { canUndo.value = len > 0 })
  watch(() => redoStack.value.length, (len) => { canRedo.value = len > 0 })

  // Save initial state
  undoStack.value = []
  redoStack.value = []

  // Watch for changes and auto-push snapshots (debounced)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => JSON.stringify(store.pages) + JSON.stringify(store.styleClasses) + JSON.stringify(store.userComponents),
    () => {
      if (paused.value) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => pushState(), 300)
    },
  )

  return { undo, redo, canUndo, canRedo }
}
