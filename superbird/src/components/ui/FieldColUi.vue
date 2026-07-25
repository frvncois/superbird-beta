<script setup lang="ts">
import LabelUi from './LabelUi.vue'

// Vertical field: label stacked above its control — the column counterpart to
// FieldRowUi (which lays label + control side by side). With `drag`, the label
// doubles as the scrub handle for the bound `v-model`, same contract as FieldRowUi.
withDefaults(
  defineProps<{
    label: string
    drag?: boolean
  }>(),
  {
    drag: false,
  },
)

// Scrub value (only meaningful with `drag`).
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="space-y-1">
    <LabelUi v-model="model" size="xs" :drag="drag" class="text-secondary">{{ label }}</LabelUi>
    <slot />
  </div>
</template>
