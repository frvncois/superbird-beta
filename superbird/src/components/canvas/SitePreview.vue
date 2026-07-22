<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import CanvasNodeRenderer from './CanvasNodeRenderer.vue'

// Read-only render of the current page, for the dashboard preview.
const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
</script>

<template>
  <div class="h-full overflow-auto">
    <div class="mx-auto canvas-artboard h-full" :style="globalStylesStore.globalCssVars">
      <CanvasNodeRenderer :node="store.bodyNode" preview />
    </div>
  </div>
</template>
