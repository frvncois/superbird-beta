<script setup lang="ts">
import LabelUi from './LabelUi.vue'

withDefaults(
  defineProps<{
    label: string
    drag?: boolean
  }>(),
  {
    drag: false,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="space-y-1">
    <LabelUi v-model="model" size="xs" :drag="drag" class="text-secondary">{{ label }}</LabelUi>
    <slot />
  </div>
</template>
