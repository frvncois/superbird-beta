<script setup lang="ts">
// Dashboard shell: header on top, a data sidebar, and a site preview canvas.
// The sidebar widens (`wide`) when a "View all" detail is open.
withDefaults(defineProps<{ wide?: boolean }>(), { wide: false })
</script>

<template>
  <div class="dashboard-layout" :class="wide && 'is-wide'">
    <header class="dashboard-header border-b p-4 flex items-center justify-between">
      <slot name="header" />
    </header>

    <aside class="dashboard-sidebar border-r overflow-auto">
      <slot name="sidebar" />
    </aside>

    <main class="dashboard-canvas overflow-hidden border-t">
      <slot name="canvas" />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-rows: 48px 1fr;
  grid-template-columns: 280px 1fr;
  grid-template-areas:
    "header  header"
    "sidebar canvas";
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-background);
  transition: grid-template-columns 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-layout.is-wide {
  grid-template-columns: 520px 1fr;
}

.dashboard-header { grid-area: header; }
.dashboard-sidebar { grid-area: sidebar; }
.dashboard-canvas { grid-area: canvas; }
</style>
