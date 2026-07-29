<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { parseUnitValue, readUnitInput, commitUnitInput, stepUnitValue } from '@/lib/unitValue'
import { GlobalTokensKey, type GlobalTokens } from '@/constants/injectionKeys'
import PopoverUi from './PopoverUi.vue'
import IconUi from './IconUi.vue'
import ButtonUi from './ButtonUi.vue'
import BadgeUi from './BadgeUi.vue'

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

// While the user types a unit inline (e.g. "90em"), the field holds the raw text
// until the unit completes; otherwise it shows the number only. Non-null = draft.
const draft = ref<string | null>(null)

const sizeTokens = computed(() =>
  Object.entries(props.tokens?.sizes ?? injectedTokens?.value.sizes ?? {}),
)
const hasTokens = computed(() => sizeTokens.value.length > 0)

const parsed = computed(() => {
  const val = model.value
  if (val.startsWith('var(--global-size-')) return { num: val, unit: 'token' }
  return parseUnitValue(val, ['auto', 'none'])
})

const tokenName = computed(() => {
  const match = model.value.match(/^var\(--global-size-(.+)\)$/)
  return match ? match[1]! : null
})

const allUnits = computed(() =>
  props.allowAuto ? [...props.units, 'auto'] : props.units,
)

// The unit to combine a typed number with (never 'auto'/'token').
const currentUnit = computed(() =>
  parsed.value.unit === 'auto' || parsed.value.unit === 'token' ? 'px' : parsed.value.unit,
)

// What the number field displays: the live draft while typing a unit, else the number.
const displayNum = computed(() =>
  draft.value ?? (parsed.value.unit === 'auto' ? '' : parsed.value.num),
)

function clearToken() {
  draft.value = null
  model.value = ''
}

function handleNumInput(e: Event) {
  const el = e.target as HTMLInputElement
  const { model: next, draft: d } = readUnitInput(el.value, currentUnit.value, props.units)
  draft.value = d
  model.value = next
  // Unit adopted or stray text stripped → make the DOM match the number now, so
  // a stripped suffix doesn't linger a frame.
  if (d === null && el.value !== displayNum.value) el.value = displayNum.value
}

// Blur: resolve any half-typed unit (adopt if complete, else drop) and collapse
// the field back to the number.
function finalizeInput(e: Event) {
  if (draft.value === null) return
  draft.value = null
  model.value = commitUnitInput((e.target as HTMLInputElement).value, currentUnit.value, props.units)
}

function selectUnit(unit: string) {
  unitOpen.value = false
  draft.value = null
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
  draft.value = null
  model.value = `var(--global-size-${name})`
  tokenOpen.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (parsed.value.unit === 'token') return
  stepUnitValue(e, currentUnit.value, (value) => { draft.value = null; model.value = value })
}
</script>

<template>
  <div class="relative flex h-8 min-w-0 items-center font-mono bg-input rounded-xl border border-input-border focus-within:border-input-border-focus outline-3 outline-transparent focus-within:outline-secondary/10 transition-colors duration-150">
    <ButtonUi
      v-if="hasTokens && !tokenName"
      variant="bare"
      size="xs"
      icon="classes"
      title="Size tokens"
      class="size-7 shrink-0"
      @click.stop="tokenOpen = !tokenOpen"
    />

    <div v-if="tokenName" class="flex flex-1 items-center justify-between gap-1 px-1.5 min-w-0">
      <BadgeUi variant="primary" size="xs" class="min-w-0">
        <span class="truncate">{{ tokenName }}</span>
        <ButtonUi variant="bare" title="Clear token"  @click="clearToken">
          <IconUi name="close" size="size-2.5" />
        </ButtonUi>
      </BadgeUi>
      <ButtonUi
        variant="bare"
        size="xs"
        icon="chevron-down"
        title="Change token"
        class="size-4 shrink-0"
        @click.stop="tokenOpen = !tokenOpen"
      />
    </div>

    <input
      v-else
      :value="displayNum"
      :placeholder="parsed.unit === 'auto' ? 'auto' : placeholder ?? '0'"
      :disabled="parsed.unit === 'auto'"
      class="h-full flex-1 min-w-0 bg-transparent text-xs text-foreground placeholder:text-secondary/50 outline-none disabled:opacity-40"
      @input="handleNumInput"
      @keydown="handleKeydown"
      @blur="finalizeInput"
    />

    <button
      v-if="!tokenName"
      class="flex h-full shrink-0 items-center gap-0.5 border-l border-foreground/10 px-1.5 text-[10px] text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
      @click.stop="unitOpen = !unitOpen"
    >
      {{ parsed.unit === 'auto' ? 'auto' : parsed.unit || 'px' }}
      <IconUi name="chevron-down" size="size-2.5" />
    </button>

    <PopoverUi v-model:open="unitOpen" align="right" panel-class="min-w-14 p-0.5 rounded-xl">
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
    </PopoverUi>

    <PopoverUi v-model:open="tokenOpen" align="left" panel-class="min-w-28 p-3.5">
      <button
        v-for="[name, value] in sizeTokens"
        :key="name"
        class="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="selectToken(name)"
      >
        <span class="font-mono text-[10px] font-medium">{{ name }}</span>
        <span class="text-[10px] text-secondary">{{ value }}</span>
      </button>
    </PopoverUi>
  </div>
</template>
