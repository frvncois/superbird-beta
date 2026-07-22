<script setup lang="ts">
type LabelWidth = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    label: string
    labelWidth?: LabelWidth
  }>(),
  {
    labelWidth: 'lg',
  },
)

const widthClasses: Record<LabelWidth, string> = {
  sm: 'w-12',
  md: 'w-14',
  lg: 'w-16',
}
</script>

<template>
  <div class="grid grid-cols-2 items-center gap-2">
    <span :class="[widthClasses[props.labelWidth], 'shrink-0 text-[9px] text-secondary font-mono tracking-wider uppercase']">{{ label }}</span>
    <slot />
  </div>
</template>
