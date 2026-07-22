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

.editor-header { grid-area: header; }
.editor-sidebar-left { grid-area: left; }
.editor-canvas { grid-area: canvas; }
.editor-sidebar-right { grid-area: right; }
</style>
