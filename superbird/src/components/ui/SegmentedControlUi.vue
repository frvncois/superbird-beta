<script setup lang="ts">
import TooltipUi from '@/components/ui/TooltipUi.vue'

export interface SegmentedOption {
  value: string
  label?: string
  title?: string
  icon?: string
  tooltip?: string
}

withDefaults(
  defineProps<{
    options: SegmentedOption[]
    size?: 'default' | 'xs'
    grow?: boolean
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  }>(),
  {
    size: 'default',
    grow: false,
    tooltipPlacement: 'top',
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div
    :class="[
      'flex items-center bg-foreground/5 p-0.5',
      size === 'xs' ? 'rounded-md' : 'gap-0.5 rounded-lg',
    ]"
  >
    <TooltipUi
      v-for="opt in options"
      :key="opt.value"
      :content="opt.tooltip ?? ''"
      :placement="tooltipPlacement"
      :class="grow && 'flex-1'"
    >
      <button
        type="button"
        :title="opt.tooltip ? undefined : opt.title"
        :aria-label="opt.title ?? opt.tooltip"
        :class="[
          'flex items-center font-mono text-[10px] tracking-wider uppercase justify-center gap-1 cursor-pointer',
          grow && 'w-full flex-1',
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
    </TooltipUi>
  </div>
</template>
