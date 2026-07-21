<script setup lang="ts">
import { ref } from 'vue'
import { parseUnitValue } from '@/lib/unitValue'

const props = defineProps<{
  sensitivity?: number
}>()

const model = defineModel<string>({ default: '' })

const isDragging = ref(false)
let startX = 0
let startValue = 0

function parseNum(val: string): { num: number; unit: string } {
  const parsed = parseUnitValue(val)
  const num = parseFloat(parsed.num)
  return { num: isNaN(num) ? 0 : num, unit: parsed.unit }
}

function onPointerDown(e: PointerEvent) {
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

  let step = props.sensitivity ?? 1
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
    :class="['cursor-ew-resize select-none', isDragging && 'text-primary']"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <slot />
  </span>
</template>
