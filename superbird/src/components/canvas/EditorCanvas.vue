<script setup lang="ts">
import { ref, computed, watchEffect, onBeforeUnmount } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useAuthStore } from '@/stores/auth'
import { compileTailwindCss } from '@/lib/tailwindToStyles'
import { fontFaceCss } from '@/lib/fonts'
import { defaultFontFamilies } from '@/data/defaultFonts'
import type { CanvasNode } from '@/types/canvas'
import CanvasNodeRenderer from './CanvasNodeRenderer.vue'
import CommentsLayer from './CommentsLayer.vue'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const auth = useAuthStore()
const isBaseViewport = computed(() => globalStylesStore.isBaseViewport)

// ⌘/Ctrl-click drops a comment pin anchored to the node under the cursor. A
// capture-phase listener runs before the node's own (bubble) click, so
// stopPropagation here suppresses selection for this gesture only.
const commentsLayer = ref<InstanceType<typeof CommentsLayer> | null>(null)
function onCanvasClickCapture(e: MouseEvent) {
  if (!(e.metaKey || e.ctrlKey) || !auth.currentUser) return
  const el = (e.target as HTMLElement).closest('.canvas-artboard [data-node-id]') as HTMLElement | null
  if (!el?.dataset.nodeId) return
  e.preventDefault()
  e.stopPropagation()
  const r = el.getBoundingClientRect()
  commentsLayer.value?.startDraft({
    nodeId: el.dataset.nodeId,
    nx: r.width ? (e.clientX - r.left) / r.width : 0.5,
    ny: r.height ? (e.clientY - r.top) / r.height : 0.5,
  })
}

// Compile the page's Tailwind classes (incl. variants like md:/hover:) to real
// CSS scoped under .canvas-artboard, so utilities render live in the canvas
// without leaking into the admin UI. The published site emits the same via CSS.
function collectClasses(node: CanvasNode, set: Set<string>) {
  for (const c of node.classes) set.add(c)
  for (const child of node.children) collectClasses(child, set)
}
const styleEl = document.createElement('style')
styleEl.setAttribute('data-canvas-tailwind', '')
document.head.appendChild(styleEl)
watchEffect(() => {
  const set = new Set<string>()
  collectClasses(store.bodyNode, set)
  // Make the artboard a query container so responsive variants track its width.
  styleEl.textContent = '.canvas-artboard{container-type:inline-size}' + compileTailwindCss([...set], '.canvas-artboard')
})
onBeforeUnmount(() => styleEl.remove())

// Self-hosted @font-face rules for the project's font set, so added Google /
// Fontshare / custom fonts render live in the canvas.
const fontEl = document.createElement('style')
fontEl.setAttribute('data-canvas-fonts', '')
document.head.appendChild(fontEl)
watchEffect(() => {
  fontEl.textContent = fontFaceCss([...defaultFontFamilies(), ...(globalStylesStore.globalStyles.fontSet ?? [])])
})
onBeforeUnmount(() => fontEl.remove())

const artboardStyle = computed(() => {
  const vars = { ...globalStylesStore.globalCssVars }
  if (!isBaseViewport.value) {
    Object.assign(vars, {
      width: `${globalStylesStore.activeViewportWidth}px`,
      maxWidth: '100%',
      transition: 'width 0.3s ease',
    })
  }
  return vars
})

function handleClick() {
  store.selectNode(null)
}
</script>

<template>
  <div
    :class="['h-full overflow-auto', isBaseViewport ? '' : 'p-8']"
    data-canvas-scroll
    @click.self="handleClick"
    @click.capture="onCanvasClickCapture"
  >
    <!-- `canvas-artboard` is a structural hook (selection sync + scoped compiled
         CSS); the arbitrary props force light-theme tokens inside the artboard
         regardless of app dark mode (inline :style / user tokens still win).
         `relative` makes it the positioning context for the comment pin overlay. -->
    <div
      :class="[
        'relative mx-auto canvas-artboard [--color-background:#ffffff] [--color-foreground:#0a0a0a] [--color-border:#e5e7eb] [--color-secondary:#a0a3a6] text-[#0a0a0a]',
        isBaseViewport ? 'h-full' : 'min-h-full',
      ]"
      :style="artboardStyle"
    >
      <CanvasNodeRenderer :node="store.bodyNode" />
      <CommentsLayer v-if="auth.currentUser" ref="commentsLayer" />
    </div>
  </div>
</template>
