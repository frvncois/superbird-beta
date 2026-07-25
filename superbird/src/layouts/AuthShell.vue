<script setup lang="ts">
// Chrome-free centered frame for the unauthenticated screens (login / setup):
// a single card slotted dead-center on the app background.
</script>

<template>
  <div class="flex min-h-dvh w-full items-center justify-center bg-background p-6">
    <slot />
  </div>
</template>
