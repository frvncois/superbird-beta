<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from './icons'

const props = withDefaults(
  defineProps<{
    name: string
    size?: string
  }>(),
  {
    size: 'size-3.5',
  },
)

const component = computed(() => ICONS[props.name] ?? ICONS.close)
</script>

<template>
  <component :is="component" :class="size" aria-hidden="true" />
</template>
