import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useUserComponentsStore } from '@/stores/userComponents'

const MAX_HISTORY = 50

interface Snapshot {
  pages: string
  styleClasses: string
  userComponents: string
}

// Module-scope singleton state: every useHistory() caller shares the same
// stacks, so the header buttons and keyboard shortcuts stay in sync.
const undoStack = ref<Snapshot[]>([])
const redoStack = ref<Snapshot[]>([])
const paused = ref(false)
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let watcherStarted = false

export function useHistory() {
  const canvas = useCanvasStore()
  const globalStyles = useGlobalStylesStore()
  const components = useUserComponentsStore()

  function takeSnapshot(): Snapshot {
    return {
      pages: JSON.stringify(canvas.pages),
      styleClasses: JSON.stringify(globalStyles.styleClasses),
      userComponents: JSON.stringify(components.userComponents),
    }
  }

  function applySnapshot(snapshot: Snapshot) {
    // Restore all three stores inside one paused section so undo stays atomic
    paused.value = true
    canvas.pages.splice(0, canvas.pages.length, ...JSON.parse(snapshot.pages))
    Object.keys(globalStyles.styleClasses).forEach((k) => delete globalStyles.styleClasses[k])
    Object.assign(globalStyles.styleClasses, JSON.parse(snapshot.styleClasses))
    Object.keys(components.userComponents).forEach((k) => delete components.userComponents[k])
    Object.assign(components.userComponents, JSON.parse(snapshot.userComponents))

    // Re-validate active page
    if (!canvas.pages.find((p) => p.id === canvas.activePageId)) {
      canvas.setActivePage(canvas.pages[0]?.id ?? '')
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

  // Watch for changes and auto-push snapshots (debounced); started once,
  // no matter how many components call useHistory()
  if (!watcherStarted) {
    watcherStarted = true
    watch(
      () => JSON.stringify(canvas.pages) + JSON.stringify(globalStyles.styleClasses) + JSON.stringify(components.userComponents),
      () => {
        if (paused.value) return
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => pushState(), 300)
      },
    )
  }

  return { undo, redo, canUndo, canRedo }
}
