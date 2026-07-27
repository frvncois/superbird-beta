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
// The last *committed* document snapshot. Undo must restore the state as it was
// before the most recent change, so the undo stack holds pre-mutation snapshots;
// `lastSnapshot` is the one to push when the next change commits. Seeded with a
// baseline when the watcher starts so the very first undo has something to pop.
let lastSnapshot: Snapshot | null = null

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
    // Stack the state *before* this change (lastSnapshot), then advance the
    // baseline to the new current state. Pushing the post-mutation snapshot
    // (as before) made the first undo a no-op and lost the original baseline.
    if (lastSnapshot) {
      undoStack.value.push(lastSnapshot)
      if (undoStack.value.length > MAX_HISTORY) {
        undoStack.value.shift()
      }
    }
    lastSnapshot = takeSnapshot()
    redoStack.value = []
  }

  // Clear undo/redo and reseed the baseline from the current stores. Call after
  // a snapshot restore (or any wholesale document swap) so an undo can't pop the
  // pre-restore document back.
  function reset() {
    undoStack.value = []
    redoStack.value = []
    lastSnapshot = takeSnapshot()
  }

  function undo() {
    if (undoStack.value.length === 0) return
    redoStack.value.push(lastSnapshot ?? takeSnapshot())
    const snapshot = undoStack.value.pop()!
    lastSnapshot = snapshot
    applySnapshot(snapshot)
  }

  function redo() {
    if (redoStack.value.length === 0) return
    undoStack.value.push(lastSnapshot ?? takeSnapshot())
    const snapshot = redoStack.value.pop()!
    lastSnapshot = snapshot
    applySnapshot(snapshot)
  }

  // Watch for changes and auto-push snapshots (debounced); started once,
  // no matter how many components call useHistory()
  if (!watcherStarted) {
    watcherStarted = true
    // Seed the baseline from the already-hydrated document (the editor mounts,
    // and thus this watcher starts, only after project load completes).
    lastSnapshot = takeSnapshot()
    // Deep-watch the source refs directly. Using JSON.stringify as the watch
    // *source* would re-serialize the whole document on every reactive flush
    // (e.g. per pointermove during a drag); the stringify belongs inside the
    // debounced pushState (takeSnapshot), which is where it now lives.
    watch(
      [() => canvas.pages, () => globalStyles.styleClasses, () => components.userComponents],
      () => {
        if (paused.value) return
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => pushState(), 300)
      },
      { deep: true },
    )
  }

  return { undo, redo, reset, canUndo, canRedo }
}
