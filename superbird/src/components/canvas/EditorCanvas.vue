<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import CanvasNodeRenderer from './CanvasNodeRenderer.vue'
import EntryInspectorBar from './EntryInspectorBar.vue'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const isDesktop = computed(() => globalStylesStore.activeBreakpoint === 'desktop')

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
  <div class="flex h-full flex-col">
    <EntryInspectorBar />
    <div
      :class="['min-h-0 flex-1 overflow-auto', isDesktop ? '' : 'p-8']"
      data-canvas-scroll
      @click.self="handleClick"
    >
      <div :class="['mx-auto canvas-artboard', isDesktop ? 'h-full' : 'min-h-full']" :style="artboardStyle">
        <CanvasNodeRenderer :node="store.bodyNode" />
      </div>
    </div>
  </div>
</template>
