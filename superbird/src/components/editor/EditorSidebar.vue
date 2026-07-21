<script setup lang="ts">
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Sidebar header (tabs or custom) -->
    <div v-if="$slots.header" class="shrink-0">
      <slot name="header" />
    </div>

    <!-- Sidebar content -->
    <div class="flex-1 overflow-y-auto sticky">
      <slot />
    </div>

    <!-- Sidebar footer -->
    <div v-if="$slots.footer" class="border-t px-3 py-2.5">
      <slot name="footer" />
    </div>
  </div>
</template>
