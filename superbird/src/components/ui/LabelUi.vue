<script setup lang="ts">
import { ref } from 'vue'
import { parseUnitValue } from '@/lib/unitValue'

const props = withDefaults(
  defineProps<{
    size?: 'default' | 'sm' | 'xs'
    drag?: boolean
  }>(),
  {
    size: 'default',
    drag: false,
  },
)

const model = defineModel<string>({ default: '' })

const sizeClasses: Record<'default' | 'sm' | 'xs', string> = {
  default: 'text-[10px]',
  sm: 'text-[10px]',
  xs: 'text-[9px]',
}

const isDragging = ref(false)
let startX = 0
let startValue = 0

function parseNum(val: string): { num: number; unit: string } {
  const parsed = parseUnitValue(val)
  const num = parseFloat(parsed.num)
  return { num: isNaN(num) ? 0 : num, unit: parsed.unit }
}

function onPointerDown(e: PointerEvent) {
  if (!props.drag) return
  startValue = parseNum(model.value).num
  startX = e.clientX
  isDragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  document.body.style.cursor = 'ew-resize'
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - startX
  let step = 1
  if (e.shiftKey) step *= 10
  if (e.altKey) step *= 0.1
  const { unit } = parseNum(model.value)
  const next = Math.round((startValue + dx * step) * 100) / 100
  model.value = next + unit
}

function onPointerUp() {
  isDragging.value = false
  document.body.style.cursor = ''
}
</script>

<template>
  <span
    :class="[
      'font-mono uppercase tracking-widest',
      sizeClasses[size],
      drag && 'cursor-ew-resize select-none',
      isDragging && '!text-primary',
    ]"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <slot />
  </span>
</template>
