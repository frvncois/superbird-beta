<script setup lang="ts">
// Settings body: a fixed nav rail (shared --sidebar-width) beside a scrolling
// content column. Lives inside AppShell's body slot. `#nav` = the rail, default
// slot = the panel content.
</script>

<template>
  <div class="flex h-full w-full min-h-0">
    <nav class="flex w-[var(--sidebar-width)] shrink-0 flex-col p-3.5">
      <slot name="nav" />
    </nav>
    <main class="min-w-0 flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
