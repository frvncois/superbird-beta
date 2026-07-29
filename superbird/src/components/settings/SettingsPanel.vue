<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="mx-auto max-w-2xl px-8 py-8">
    <header v-if="title || description" class="mb-6 space-y-1">
      <h1 v-if="title" class="text-lg font-semibold text-foreground">{{ title }}</h1>
      <p v-if="description" class="text-sm leading-relaxed text-secondary">{{ description }}</p>
    </header>
    <div class="space-y-10">
      <slot />
    </div>
  </div>
</template>
