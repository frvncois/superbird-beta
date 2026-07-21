<script setup lang="ts">
export interface SegmentedOption {
  value: string
  label?: string
  title?: string
}

withDefaults(
  defineProps<{
    options: SegmentedOption[]
    size?: 'default' | 'xs'
    grow?: boolean
  }>(),
  {
    size: 'default',
    grow: false,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div
    :class="[
      'flex items-center bg-foreground/5 p-0.5',
      size === 'xs' ? 'rounded-md' : 'gap-0.5 rounded-xl',
    ]"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :title="opt.title"
      :class="[
        'flex items-center justify-center gap-1 cursor-pointer',
        grow && 'flex-1',
        size === 'xs'
          ? 'rounded px-1.5 py-0.5 text-[9px] font-mono transition-all duration-100'
          : 'rounded-lg px-2 py-1 transition-all duration-150',
        model === opt.value
          ? 'bg-background text-foreground shadow-sm'
          : 'text-secondary hover:text-foreground',
      ]"
      @click="model = opt.value"
    >
      <slot name="option" :option="opt" :active="model === opt.value">{{ opt.label }}</slot>
    </button>
  </div>
</template>
