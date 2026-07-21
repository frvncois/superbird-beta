<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'default' | 'xs'
  }>(),
  {
    size: 'default',
  },
)
</script>

<template>
  <span
    :class="
      size === 'xs'
        ? 'text-[9px] font-mono uppercase tracking-wider text-secondary/50'
        : 'text-[10px] font-mono uppercase tracking-wider text-secondary'
    "
  >
    <slot />
  </span>
</template>
