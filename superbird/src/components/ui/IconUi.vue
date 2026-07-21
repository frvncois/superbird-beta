<script setup lang="ts">
import { ICON_PATHS } from './icons'

withDefaults(
  defineProps<{
    name: string
    size?: string
  }>(),
  {
    size: 'size-3.5',
  },
)
</script>

<template>
  <svg :class="size" viewBox="0 0 20 20" fill="currentColor">
    <path
      v-for="(p, i) in ICON_PATHS[name] ?? []"
      :key="i"
      :d="p.d"
      :fill-rule="p.fillRule"
      :clip-rule="p.fillRule"
    />
  </svg>
</template>
