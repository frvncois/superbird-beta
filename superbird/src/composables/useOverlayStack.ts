import { reactive } from 'vue'

// Coordination between ModalUi instances and the single OverlayHostUi
// (mounted once in App.vue). Every open modal/dialog registers here; the host
// derives the per-layer backdrop from this stack and owns the global Escape /
// backdrop-click dismissal. A closed overlay is simply absent — it contributes
// nothing to the stack or the DOM.

// Two layers so a dialog always floats above an open modal (matching the old
// per-instance z-[100]/z-[105] split).
export type OverlayLayer = 'modal' | 'dialog'

interface OverlayEntry {
  id: number
  layer: OverlayLayer
  dismiss: () => void
}

let nextId = 1
export const overlayStack = reactive<OverlayEntry[]>([])

/** Register an open overlay. Returns its release function. */
export function registerOverlay(layer: OverlayLayer, dismiss: () => void): () => void {
  const id = nextId++
  overlayStack.push({ id, layer, dismiss })
  return () => {
    const i = overlayStack.findIndex((e) => e.id === id)
    if (i !== -1) overlayStack.splice(i, 1)
  }
}

/** Dismiss the top overlay of one layer (backdrop click). */
export function dismissTop(layer: OverlayLayer): void {
  const stack = overlayStack.filter((e) => e.layer === layer)
  stack[stack.length - 1]?.dismiss()
}

/** Escape: dialogs render above modals, so they take the key first. */
export function dismissTopmost(): void {
  dismissTop(overlayStack.some((e) => e.layer === 'dialog') ? 'dialog' : 'modal')
}
