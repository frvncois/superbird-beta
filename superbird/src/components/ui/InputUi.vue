<script setup lang="ts">
type InputSize = 'default' | 'sm' | 'xs'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    size?: InputSize
    type?: string
  }>(),
  {
    size: 'sm',
    type: 'text',
  },
)

const model = defineModel<string>({ default: '' })

const sizeClasses: Record<InputSize, string> = {
  default: 'h-12 px-3 text-sm rounded-2xl',
  sm: 'h-8 px-2.5 text-xs rounded-xl',
  xs: 'h-7 px-2 text-xs rounded-lg',
}
</script>

<template>
  <input
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :class="[
      'w-full min-w-0 bg-transparent text-foreground placeholder:text-foreground/40 border border-foreground/15 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10',
      sizeClasses[props.size],
    ]"
  />
</template>
