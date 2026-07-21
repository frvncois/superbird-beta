<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue?: string
  sensitivity?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isDragging = ref(false)
let startX = 0
let startValue = 0

function parseValue(val: string): { num: number; unit: string } {
  const trimmed = (val ?? '').trim()
  if (!trimmed) return { num: 0, unit: 'px' }
  const match = trimmed.match(/^(-?[\d.]+)\s*(.*)$/)
  if (match) return { num: parseFloat(match[1]!), unit: match[2] || 'px' }
  return { num: 0, unit: 'px' }
}

function onPointerDown(e: PointerEvent) {
  const parsed = parseValue(props.modelValue ?? '')
  startValue = isNaN(parsed.num) ? 0 : parsed.num
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

  const parsed = parseValue(props.modelValue ?? '')
  const next = Math.round((startValue + dx * step) * 100) / 100
  emit('update:modelValue', next + parsed.unit)
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
