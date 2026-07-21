<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center justify-center gap-1 text-center text-xs text-secondary',
      compact ? 'py-6' : 'py-12',
    ]"
  >
    <slot>{{ message }}</slot>
  </div>
</template>
