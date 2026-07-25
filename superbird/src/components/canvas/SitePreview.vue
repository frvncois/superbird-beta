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
    <div
      class="mx-auto canvas-artboard h-full [--color-background:#ffffff] [--color-foreground:#0a0a0a] [--color-border:#e5e7eb] [--color-secondary:#a0a3a6] text-[#0a0a0a]"
      :style="globalStylesStore.globalCssVars"
    >
      <CanvasNodeRenderer :node="store.bodyNode" preview />
    </div>
  </div>
</template>
