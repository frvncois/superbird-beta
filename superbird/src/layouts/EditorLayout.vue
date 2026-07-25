<script setup lang="ts">
import { computed } from 'vue'

// Editor body grid (left | canvas | right). Header is owned by AppShell. Each
// rail collapses to a thin strip; content-mode hides both rails entirely.
const props = defineProps<{
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  contentMode?: boolean
}>()

const gridTemplateColumns = computed(() =>
  props.contentMode
    ? '0 1fr 0'
    : `${props.leftCollapsed ? '44px' : 'var(--sidebar-width)'} 1fr ${props.rightCollapsed ? '44px' : 'var(--sidebar-width)'}`,
)
</script>

<template>
  <div class="editor-body" :style="{ gridTemplateColumns }">
    <aside v-show="!contentMode" class="editor-sidebar-left overflow-hidden">
      <slot name="sidebar-left" />
    </aside>

    <main class="editor-canvas overflow-auto border rounded-xl mb-3.5">
      <slot name="canvas" />
    </main>

    <aside v-show="!contentMode" class="editor-sidebar-right overflow-hidden">
      <slot name="sidebar-right" />
    </aside>
  </div>
</template>

<style scoped>
.editor-body {
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-areas: "left canvas right";
  transition: grid-template-columns 0.2s ease;
}

/* The canvas is `isolate`d into its own stacking context pinned at z-index:0, so
   a user element's z-index (even a sticky site header) can never escape above the
   sidebars/header and their dropdowns. */
.editor-sidebar-left { grid-area: left; position: relative; z-index: 30; }
.editor-sidebar-right { grid-area: right; position: relative; z-index: 30; }
.editor-canvas { grid-area: canvas; position: relative; z-index: 0; isolation: isolate; }
</style>
