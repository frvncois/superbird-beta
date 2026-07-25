<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
    size?: 'xs' | 'sm'
    dot?: boolean
    pulse?: boolean
    mono?: boolean
  }>(),
  {
    variant: 'default',
    size: 'sm',
    dot: false,
    pulse: false,
    mono: false,
  },
)

const styles = {
  default: { badge: 'bg-muted-bg text-muted-fg', dot: 'bg-secondary' },
  success: { badge: 'bg-green-bg text-green-fg', dot: 'bg-green-fg' },
  warning: { badge: 'bg-amber-bg text-amber-fg', dot: 'bg-amber-fg' },
  error: { badge: 'bg-red-bg text-red-fg', dot: 'bg-red-fg' },
  info: { badge: 'bg-blue-bg text-blue-fg', dot: 'bg-blue-fg' },
  neutral: { badge: 'bg-secondary/10 text-secondary', dot: 'bg-secondary' },
  primary: { badge: 'bg-primary/10 text-primary', dot: 'bg-primary' },
} as const

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-md gap-1',
  sm: 'text-xs px-2 py-0.5 rounded-lg gap-1.5',
} as const
</script>

<template>
  <span
    class="inline-flex items-center transition-colors duration-300"
    :class="[styles[variant].badge, sizes[size], mono ? 'font-mono uppercase tracking-wider' : 'font-medium']"
  >
    <span
      v-if="dot"
      class="size-1.5 shrink-0 rounded-full"
      :class="[styles[variant].dot, pulse && 'animate-pulse']"
    />
    <slot />
  </span>
</template>
