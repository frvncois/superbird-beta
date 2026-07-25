<script setup lang="ts">
import LabelUi from './LabelUi.vue'

type LabelWidth = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    label: string
    labelWidth?: LabelWidth
    // When true, dragging the label scrubs the bound `v-model` numeric value
    // (the label doubles as the drag handle — no separate DragLabel needed).
    drag?: boolean
  }>(),
  {
    labelWidth: 'lg',
    drag: false,
  },
)

// Scrub value (only meaningful with `drag`).
const model = defineModel<string>({ default: '' })

const widthClasses: Record<LabelWidth, string> = {
  sm: 'w-12',
  md: 'w-14',
  lg: 'w-16',
}
</script>

<template>
  <div class="grid grid-cols-2 grid-cols-[0.5fr_1fr] items-center gap-2">
    <LabelUi
      v-model="model"
      size="xs"
      :drag="drag"
      :class="[widthClasses[props.labelWidth], 'shrink-0 text-secondary']"
    >{{ label }}</LabelUi>
    <slot />
  </div>
</template>
