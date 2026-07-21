<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    size?: 'default' | 'sm'
  }>(),
  {
    size: 'sm',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :class="[
      'w-full min-w-0 bg-transparent text-foreground placeholder:text-foreground/40 border border-foreground/15 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10',
      size === 'default' ? 'h-12 px-3 text-sm rounded-2xl' : 'h-8 px-2.5 text-xs rounded-xl',
    ]"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
