<script setup lang="ts">
// Dashboard body grid (sidebar | canvas). Header is owned by AppShell. The
// sidebar widens for the "View all" detail panel.
withDefaults(defineProps<{ wide?: boolean }>(), { wide: false })
</script>

<template>
  <div class="dashboard-body" :class="wide && 'is-wide'">
    <aside class="dashboard-sidebar overflow-auto">
      <slot name="sidebar" />
    </aside>

    <main class="dashboard-canvas overflow-hidden border rounded-xl mr-3.5 mb-3.5">
      <slot name="canvas" />
    </main>
  </div>
</template>

<style scoped>
.dashboard-body {
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-areas: "sidebar canvas";
  transition: grid-template-columns 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-body.is-wide {
  grid-template-columns: 520px 1fr;
}

.dashboard-sidebar { grid-area: sidebar; }
.dashboard-canvas { grid-area: canvas; }
</style>
