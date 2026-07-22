<script setup lang="ts">
import { computed, watchEffect, onBeforeUnmount } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { compileTailwindCss } from '@/lib/tailwindToStyles'
import { fontFaceCss } from '@/lib/fonts'
import { defaultFontFamilies } from '@/data/defaultFonts'
import type { CanvasNode } from '@/types/canvas'
import CanvasNodeRenderer from './CanvasNodeRenderer.vue'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const isDesktop = computed(() => globalStylesStore.activeBreakpoint === 'desktop')

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
  if (!isDesktop.value) {
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
    :class="['h-full overflow-auto', isDesktop ? '' : 'p-8']"
    data-canvas-scroll
    @click.self="handleClick"
  >
    <div :class="['mx-auto canvas-artboard', isDesktop ? 'h-full' : 'min-h-full']" :style="artboardStyle">
      <CanvasNodeRenderer :node="store.bodyNode" />
    </div>
  </div>
</template>
