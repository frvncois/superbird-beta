<script setup lang="ts">
// Dashboard body grid (sidebar | canvas). Header is owned by AppShell. The
// sidebar widens for the "View all" detail panel.
withDefaults(defineProps<{ wide?: boolean }>(), { wide: false })
</script>

<template>
  <div
    :class="[
      'grid h-full w-full transition-[grid-template-columns] duration-300 ease-spring px-3.5 pb-3.5',
      wide ? 'grid-cols-[520px_1fr]' : 'grid-cols-[var(--sidebar-width)_1fr]',
    ]"
  >
    <aside class="col-start-1 overflow-auto pr-3.5">
      <slot name="sidebar" />
    </aside>

    <main class="col-start-2 overflow-hidden border rounded-xl">
      <slot name="canvas" />
    </main>
  </div>
</template>
