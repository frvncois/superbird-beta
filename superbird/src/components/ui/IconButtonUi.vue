<script setup lang="ts">
type IconButtonSize = 'default' | 'sm' | 'xs'
type IconButtonVariant = 'default' | 'danger'

const props = withDefaults(
  defineProps<{
    size?: IconButtonSize
    variant?: IconButtonVariant
    title?: string
    disabled?: boolean
  }>(),
  {
    size: 'default',
    variant: 'default',
  },
)

const sizeClasses: Record<IconButtonSize, string> = {
  default: 'size-7 rounded-xl',
  sm: 'size-5 rounded-lg',
  xs: 'size-4 rounded',
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-secondary hover:bg-secondary/10 hover:text-foreground',
  danger: 'text-secondary hover:bg-red-bg hover:text-red-fg',
}
</script>

<template>
  <button
    type="button"
    :title="title"
    :disabled="disabled"
    :class="[
      'flex shrink-0 items-center justify-center cursor-pointer transition-colors duration-150',
      sizeClasses[props.size],
      variantClasses[props.variant],
      disabled && 'pointer-events-none opacity-40',
    ]"
  >
    <slot />
  </button>
</template>
