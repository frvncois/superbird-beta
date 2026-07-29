<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    description?: string
    stacked?: boolean
  }>(),
  { stacked: false },
)
</script>

<template>
  <div :class="stacked ? 'px-4 py-3.5 space-y-2.5' : 'flex items-center justify-between gap-6 px-4 py-3'">
    <div v-if="label || description" class="min-w-0">
      <div v-if="label" class="text-sm text-foreground">{{ label }}</div>
      <p v-if="description" class="mt-0.5 text-xs leading-relaxed text-secondary">{{ description }}</p>
    </div>
    <div :class="stacked ? '' : 'flex shrink-0 items-center justify-end'">
      <div :class="stacked ? '' : 'w-full max-w-[15rem]'">
        <slot />
      </div>
    </div>
  </div>
</template>
