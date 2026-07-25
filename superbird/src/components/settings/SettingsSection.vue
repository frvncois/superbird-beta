<script setup lang="ts">
// A flat settings section: a title (+ optional description) above its content.
// Default wraps the slot in a bordered, divided card (for SettingsRow lists).
// `bare` drops that card so the content can bring its own containers (e.g. a
// stack of cards or an empty state). Always visible — never an accordion.
withDefaults(
  defineProps<{
    title: string
    description?: string
    bare?: boolean
  }>(),
  { bare: false },
)
</script>

<template>
  <section class="space-y-3">
    <div class="space-y-1">
      <h3 class="text-sm font-semibold text-foreground">{{ title }}</h3>
      <p v-if="description" class="text-xs leading-relaxed text-secondary">{{ description }}</p>
    </div>
    <div v-if="!bare" class="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-background">
      <slot />
    </div>
    <slot v-else />
  </section>
</template>
