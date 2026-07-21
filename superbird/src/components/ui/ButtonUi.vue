<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type ButtonVariant = 'default' | 'solid' | 'outline' | 'ghost'
type ButtonSize = 'default' | 'sm'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    to?: string
    disabled?: boolean
  }>(),
  {
    variant: 'default',
    size: 'default',
  },
)

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 text-sm rounded-xl',
  sm: 'h-7 px-3 text-xs rounded-xl',
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-foreground text-background hover:bg-foreground/85',
  solid: 'bg-primary text-white hover:bg-primary-hover',
  outline: 'bg-transparent border text-foreground hover:bg-secondary/10',
  ghost: 'bg-transparent text-foreground hover:bg-secondary/10',
}

const classes = computed(() => [
  'inline-flex items-center justify-center font-medium cursor-pointer gap-1.5 transition-[background-color,color,border-color,opacity] duration-[250ms] ease',
  sizeClasses[props.size],
  variantClasses[props.variant],
  props.disabled && 'pointer-events-none opacity-50',
])

const component = computed(() => (props.to ? RouterLink : 'button'))
</script>

<template>
  <component
    :is="component"
    :to="to"
    :disabled="disabled && !to"
    :class="classes"
  >
    <slot />
  </component>
</template>
