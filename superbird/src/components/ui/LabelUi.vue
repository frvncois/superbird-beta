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
        ? 'text-[9px] font-mono uppercase tracking-widest'
        : 'text-[10px] font-mono uppercase tracking-widest'
    "
  >
    <slot />
  </span>
</template>
