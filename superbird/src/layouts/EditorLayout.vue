<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  contentMode?: boolean
}>()

const gridTemplateColumns = computed(() =>
  props.contentMode
    ? '0 1fr 0'
    : `${props.leftCollapsed ? '44px' : '280px'} 1fr ${props.rightCollapsed ? '44px' : '280px'}`,
)
</script>

<template>
  <div class="editor-layout" :style="{ gridTemplateColumns }">
    <header class="editor-header border-b p-4 flex items-center justify-between">
      <slot name="header" />
    </header>

    <aside v-show="!contentMode" class="editor-sidebar-left border-r overflow-hidden">
      <slot name="sidebar-left" />
    </aside>

    <main class="editor-canvas overflow-auto border-t">
      <slot name="canvas" />
    </main>

    <aside v-show="!contentMode" class="editor-sidebar-right border-l overflow-hidden">
      <slot name="sidebar-right" />
    </aside>
  </div>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-rows: 48px 1fr;
  grid-template-areas:
    "header  header  header"
    "left    canvas  right";
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-background);
  transition: grid-template-columns 0.2s ease;
}

/* App chrome must always stack above canvas content. The canvas is `isolate`d
   into its own stacking context pinned at z-index:0, so a user element's z-index
   (even a sticky site header) can never escape above the header/sidebars and
   their dropdowns. */
.editor-header { grid-area: header; position: relative; z-index: 40; }
.editor-sidebar-left { grid-area: left; position: relative; z-index: 30; }
.editor-sidebar-right { grid-area: right; position: relative; z-index: 30; }
.editor-canvas { grid-area: canvas; position: relative; z-index: 0; isolation: isolate; }
</style>
