<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    units?: string[]
    allowAuto?: boolean
  }>(),
  {
    units: () => ['px', '%', 'em', 'rem', 'vw', 'vh'],
    allowAuto: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const unitOpen = ref(false)

const allUnits = computed(() =>
  props.allowAuto ? [...props.units, 'auto'] : props.units,
)

const parsed = computed(() => parseValue(props.modelValue ?? ''))

function parseValue(val: string): { num: string; unit: string } {
  const trimmed = val.trim()
  if (!trimmed) return { num: '', unit: 'px' }
  if (trimmed === 'auto') return { num: '', unit: 'auto' }
  if (trimmed === 'none') return { num: '', unit: 'none' }

  const match = trimmed.match(/^(-?[\d.]+)\s*(.*)$/)
  if (match) {
    return { num: match[1]!, unit: match[2] || 'px' }
  }
  return { num: trimmed, unit: 'px' }
}

function handleNumInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) {
    emit('update:modelValue', '')
    return
  }
  const unit = parsed.value.unit
  if (unit === 'auto') {
    emit('update:modelValue', val + 'px')
  } else {
    emit('update:modelValue', val + unit)
  }
}

function selectUnit(unit: string) {
  unitOpen.value = false
  if (unit === 'auto') {
    emit('update:modelValue', 'auto')
    return
  }
  const num = parsed.value.num
  if (!num) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', num + unit)
}

function handleKeydown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement
  const num = parseFloat(input.value)
  if (isNaN(num)) return

  let step = 1
  if (e.shiftKey) step = 10
  if (e.altKey) step = 0.1

  const unit = parsed.value.unit === 'auto' ? 'px' : parsed.value.unit

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const next = Math.round((num + step) * 100) / 100
    emit('update:modelValue', next + unit)
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = Math.round((num - step) * 100) / 100
    emit('update:modelValue', next + unit)
  }
}

</script>

<template>
  <div class="relative flex h-8 min-w-0 items-center rounded-xl border border-foreground/15 focus-within:border-foreground/40 outline-3 outline-transparent focus-within:outline-secondary/10 transition-colors duration-150">
    <!-- Number input -->
    <input
      :value="parsed.unit === 'auto' ? '' : parsed.num"
      :placeholder="parsed.unit === 'auto' ? 'auto' : placeholder ?? '0'"
      :disabled="parsed.unit === 'auto'"
      class="h-full flex-1 min-w-0 bg-transparent px-2.5 text-xs text-foreground placeholder:text-foreground/40 outline-none disabled:opacity-40"
      @input="handleNumInput"
      @keydown="handleKeydown"
    />

    <!-- Unit selector -->
    <button
      class="flex h-full shrink-0 items-center gap-0.5 border-l border-foreground/10 px-1.5 text-[10px] font-mono text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
      @click.stop="unitOpen = !unitOpen"
    >
      {{ parsed.unit === 'auto' ? 'auto' : parsed.unit || 'px' }}
      <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Backdrop -->
    <div v-if="unitOpen" class="fixed inset-0 z-40" @click="unitOpen = false" />

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="unitOpen"
        class="absolute right-0 top-full mt-1 z-50 min-w-14 rounded-lg border bg-background p-0.5 shadow-lg"
      >
        <button
          v-for="u in allUnits"
          :key="u"
          :class="[
            'flex w-full items-center rounded-md px-2 py-1 text-[10px] font-mono cursor-pointer transition-colors duration-100',
            (parsed.unit || 'px') === u
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground hover:bg-secondary/10',
          ]"
          @click="selectUnit(u)"
        >
          {{ u }}
        </button>
      </div>
    </Transition>
  </div>
</template>
