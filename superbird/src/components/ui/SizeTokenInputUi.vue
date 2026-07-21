<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { parseUnitValue, nextUnitValue, stepUnitValue } from '@/lib/unitValue'
import { GlobalTokensKey, type GlobalTokens } from '@/constants/injectionKeys'
import PopoverUi from './PopoverUi.vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    units?: string[]
    allowAuto?: boolean
    tokens?: GlobalTokens
  }>(),
  {
    units: () => ['px', '%', 'em', 'rem', 'vw', 'vh'],
    allowAuto: false,
  },
)

const model = defineModel<string>({ default: '' })

const injectedTokens = inject(GlobalTokensKey, undefined)
const tokenOpen = ref(false)
const unitOpen = ref(false)

const sizeTokens = computed(() =>
  Object.entries(props.tokens?.sizes ?? injectedTokens?.value.sizes ?? {}),
)
const hasTokens = computed(() => sizeTokens.value.length > 0)

// Parse value to detect if using a token
const parsed = computed(() => {
  const val = model.value
  if (val.startsWith('var(--global-size-')) return { num: val, unit: 'token' }
  return parseUnitValue(val, ['auto'])
})

const tokenName = computed(() => {
  const match = model.value.match(/^var\(--global-size-(.+)\)$/)
  return match ? match[1]! : null
})

const allUnits = computed(() =>
  props.allowAuto ? [...props.units, 'auto'] : props.units,
)

function clearToken() {
  model.value = ''
}

function handleNumInput(e: Event) {
  const el = e.target as HTMLInputElement
  const { model: next, force } = nextUnitValue(el.value, parsed.value.unit)
  model.value = next
  if (force !== null && el.value !== force) el.value = force
}

function selectUnit(unit: string) {
  unitOpen.value = false
  if (unit === 'auto') {
    model.value = 'auto'
    return
  }
  const num = parsed.value.num
  if (!num || parsed.value.unit === 'token') {
    model.value = ''
    return
  }
  model.value = num + unit
}

function selectToken(name: string) {
  model.value = `var(--global-size-${name})`
  tokenOpen.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (parsed.value.unit === 'token') return
  stepUnitValue(e, parsed.value.unit, (value) => { model.value = value })
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

    <PopoverUi v-model:open="unitOpen" align="right" panel-class="min-w-14 p-0.5 rounded-lg">
      <button
        v-for="u in allUnits"
        :key="u"
        :class="[
          'flex w-full items-center rounded-md px-2 py-1 text-[10px] font-mono cursor-pointer transition-colors duration-100',
          (parsed.unit || 'px') === u ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10',
        ]"
        @click="selectUnit(u)"
      >{{ u }}</button>
    </PopoverUi>

    <PopoverUi v-model:open="tokenOpen" align="left" panel-class="min-w-28 p-1">
      <button
        v-for="[name, value] in sizeTokens"
        :key="name"
        class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="selectToken(name)"
      >
        <span class="font-mono text-[10px] font-medium">{{ name }}</span>
        <span class="text-[10px] text-secondary">{{ value }}</span>
      </button>
    </PopoverUi>
  </div>
</template>
