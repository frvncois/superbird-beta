import { watch, nextTick } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

// Keep the three editor surfaces in sync when the selection changes: scroll the
// selected node into view on the canvas and in the layers tree, and reset the
// properties panel to the top. Scrolling both the canvas and tree to the node
// is a no-op wherever it's already visible, so we don't need to know which
// surface triggered the selection.
export function useSelectionSync() {
  const canvas = useCanvasStore()

  watch(
    () => canvas.selectedNodeId,
    (id) => {
      if (!id) return
      nextTick(() => {
        const sel = `[data-node-id="${id}"]`

        // Canvas → bring the node into view (the editable copy, not preview repeats).
        document
          .querySelector(`.canvas-artboard ${sel}`)
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })

        // Layers tree → bring the row into view.
        document
          .querySelector(`[data-layer-id="${id}"]`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })

        // Properties → back to the top (right sidebar; also the floating panel).
        document
          .querySelectorAll('[data-sidebar-scroll="right"]')
          .forEach((el) => (el as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' }))
      })
    },
  )
}
