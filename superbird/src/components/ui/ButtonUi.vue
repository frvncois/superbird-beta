<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import IconUi from './IconUi.vue'

type ButtonVariant = 'default' | 'solid' | 'outline' | 'ghost' | 'danger' | 'bare'
type ButtonSize = 'default' | 'sm' | 'xs'
type ButtonAlign = 'center' | 'start'
type ButtonTone = 'default' | 'primary'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    to?: string
    disabled?: boolean
    icon?: string
    align?: ButtonAlign
    square?: boolean
    active?: boolean
    tone?: ButtonTone
  }>(),
  {
    variant: 'default',
    size: 'default',
    align: 'center',
    tone: 'default',
  },
)

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-3.5 text-sm rounded-lg',
  sm: 'h-7 px-3.5 text-xs rounded-lg',
  xs: 'h-6 px-2 text-[11px] rounded-md',
}

const squareClasses: Record<ButtonSize, string> = {
  default: 'size-9 rounded-lg',
  sm: 'size-7 rounded-lg',
  xs: 'size-6 rounded-md',
}

const iconSize: Record<ButtonSize, string> = {
  default: 'size-4',
  sm: 'size-3.5',
  xs: 'size-3.5',
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-foreground text-background hover:bg-foreground/85',
  solid: 'bg-primary text-white hover:bg-primary-hover',
  outline: 'bg-transparent border text-foreground hover:bg-secondary/10',
  ghost: 'bg-transparent text-foreground hover:bg-secondary/10',
  danger: 'border border-red-border bg-red-bg text-red-fg hover:bg-red-bg/70',
  bare: 'text-foreground hover:text-foreground',
}

// Colour treatment: `bare` = no bg, hover colour only (primary when active);
// else `active` (selected) wins, then `tone=primary` accent, then the variant.
const colorClasses = computed(() => {
  if (props.variant === 'bare') return props.active ? 'text-primary' : 'text-secondary hover:text-foreground'
  if (props.active) return 'bg-primary/10 text-primary font-medium hover:bg-primary/15'
  if (props.tone === 'primary' && props.variant === 'ghost') return 'text-primary hover:bg-primary/10'
  return variantClasses[props.variant]
})

const classes = computed(() => [
  'inline-flex items-center font-medium cursor-pointer gap-1.5 transition-[background-color,color,border-color,opacity] duration-[250ms] ease',
  props.align === 'start' ? 'justify-start' : 'justify-center',
  // `bare` has no box: no height/padding/rounded, just the content + colour.
  props.variant === 'bare' ? '' : props.square ? squareClasses[props.size] : sizeClasses[props.size],
  colorClasses.value,
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
    <IconUi v-if="icon" :name="icon" :size="iconSize[size]" class="shrink-0" />
    <slot />
  </component>
</template>
