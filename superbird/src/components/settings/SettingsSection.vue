<script setup lang="ts">
// A flat settings section: a title (+ optional description) above a bordered
// card. Always visible — never an accordion.
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="space-y-3">
    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-foreground">{{ title }}</h3>
      <p v-if="description" class="text-xs leading-relaxed text-secondary">{{ description }}</p>
    </div>
    <div class="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-background">
      <slot />
    </div>
  </section>
</template>
