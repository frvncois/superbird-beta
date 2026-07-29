<script setup lang="ts">
import AppHeader from '@/components/header/AppHeader.vue'
</script>

<template>
  <div class="flex h-dvh w-screen flex-col overflow-hidden bg-background">
    <AppHeader />
    <div class="relative flex min-h-0 flex-1">
      <slot />
    </div>
  </div>
</template>
