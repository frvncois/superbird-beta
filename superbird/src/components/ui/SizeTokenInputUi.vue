<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

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

const store = useCanvasStore()
const tokenOpen = ref(false)

const sizeTokens = computed(() => Object.entries(store.globalStyles.sizes))
const hasTokens = computed(() => sizeTokens.value.length > 0)

// Parse value to detect if using a token
const parsed = computed(() => {
  const val = props.modelValue ?? ''
  if (!val) return { num: '', unit: 'px' }
  if (val === 'auto') return { num: '', unit: 'auto' }
  if (val.startsWith('var(--global-size-')) return { num: val, unit: 'token' }
  const match = val.match(/^(-?[\d.]+)\s*(.*)$/)
  if (match) return { num: match[1]!, unit: match[2] || 'px' }
  return { num: val, unit: 'px' }
})

const tokenName = computed(() => {
  const val = props.modelValue ?? ''
  const match = val.match(/^var\(--global-size-(.+)\)$/)
  return match ? match[1]! : null
})

const allUnits = computed(() =>
  props.allowAuto ? [...props.units, 'auto'] : props.units,
)

const unitOpen = ref(false)

function clearToken() {
  emit('update:modelValue', '')
}

function handleNumInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) { emit('update:modelValue', ''); return }
  const unit = parsed.value.unit
  if (unit === 'auto' || unit === 'token') {
    emit('update:modelValue', val + 'px')
  } else {
    emit('update:modelValue', val + unit)
  }
}

function selectUnit(unit: string) {
  unitOpen.value = false
  if (unit === 'auto') { emit('update:modelValue', 'auto'); return }
  const num = parsed.value.num
  if (!num || parsed.value.unit === 'token') { emit('update:modelValue', ''); return }
  emit('update:modelValue', num + unit)
}

function selectToken(name: string) {
  emit('update:modelValue', `var(--global-size-${name})`)
  tokenOpen.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (parsed.value.unit === 'token') return
  const input = e.target as HTMLInputElement
  const num = parseFloat(input.value)
  if (isNaN(num)) return
  let step = 1
  if (e.shiftKey) step = 10
  if (e.altKey) step = 0.1
  const unit = parsed.value.unit === 'auto' ? 'px' : parsed.value.unit
  if (e.key === 'ArrowUp') { e.preventDefault(); emit('update:modelValue', Math.round((num + step) * 100) / 100 + unit) }
  if (e.key === 'ArrowDown') { e.preventDefault(); emit('update:modelValue', Math.round((num - step) * 100) / 100 + unit) }
}

</script>

<template>
  <div class="relative flex h-8 min-w-0 items-center rounded-xl border border-foreground/15 focus-within:border-foreground/40 outline-3 outline-transparent focus-within:outline-secondary/10 transition-colors duration-150">
    <!-- Token button (only if tokens exist and no token active) -->
    <button
      v-if="hasTokens && !tokenName"
      class="flex size-7 shrink-0 items-center justify-center cursor-pointer text-secondary hover:text-foreground transition-colors duration-100"
      title="Size tokens"
      @click.stop="tokenOpen = !tokenOpen"
    >
      <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 7.378 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Token badge (when a token is active) -->
    <div v-if="tokenName" class="flex flex-1 items-center gap-1 px-1.5 min-w-0">
      <span class="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-mono text-primary leading-tight truncate">
        {{ tokenName }}
        <button class="cursor-pointer hover:text-primary/70" @click="clearToken">
          <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </span>
      <button
        class="flex size-4 shrink-0 items-center justify-center rounded cursor-pointer text-secondary hover:text-foreground"
        @click.stop="tokenOpen = !tokenOpen"
      >
        <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Number input (when not using a token) -->
    <input
      v-else
      :value="parsed.unit === 'auto' ? '' : parsed.num"
      :placeholder="parsed.unit === 'auto' ? 'auto' : placeholder ?? '0'"
      :disabled="parsed.unit === 'auto'"
      class="h-full min-w-0 flex-1 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/40 outline-none disabled:opacity-40"
      @input="handleNumInput"
      @keydown="handleKeydown"
    />

    <!-- Unit selector (hidden when token active) -->
    <button
      v-if="!tokenName"
      class="flex h-full shrink-0 items-center gap-0.5 border-l border-foreground/10 px-1.5 text-[10px] font-mono text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
      @click.stop="unitOpen = !unitOpen"
    >
      {{ parsed.unit || 'px' }}
      <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Backdrop -->
    <div v-if="unitOpen || tokenOpen" class="fixed inset-0 z-40" @click="unitOpen = false; tokenOpen = false" />

    <!-- Unit dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="unitOpen" class="absolute right-0 top-full mt-1 z-50 min-w-14 rounded-lg border bg-background p-0.5 shadow-lg">
        <button
          v-for="u in allUnits"
          :key="u"
          :class="[
            'flex w-full items-center rounded-md px-2 py-1 text-[10px] font-mono cursor-pointer transition-colors duration-100',
            (parsed.unit || 'px') === u ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10',
          ]"
          @click="selectUnit(u)"
        >{{ u }}</button>
      </div>
    </Transition>

    <!-- Token dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="tokenOpen" class="absolute left-0 top-full mt-1 z-50 min-w-28 rounded-xl border bg-background p-1 shadow-lg">
        <button
          v-for="[name, value] in sizeTokens"
          :key="name"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
          @click="selectToken(name)"
        >
          <span class="font-mono text-[10px] font-medium">{{ name }}</span>
          <span class="text-[10px] text-secondary">{{ value }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
