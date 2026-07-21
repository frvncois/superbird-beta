<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseUnitValue, stepUnitValue } from '@/lib/unitValue'
import PopoverUi from './PopoverUi.vue'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    units?: string[]
    allowAuto?: boolean
  }>(),
  {
    units: () => ['px', '%', 'em', 'rem', 'vw', 'vh'],
    allowAuto: false,
  },
)

const model = defineModel<string>({ default: '' })

const unitOpen = ref(false)

const allUnits = computed(() =>
  props.allowAuto ? [...props.units, 'auto'] : props.units,
)

const parsed = computed(() => parseUnitValue(model.value, ['auto', 'none']))

function handleNumInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!val) {
    model.value = ''
    return
  }
  const unit = parsed.value.unit
  model.value = unit === 'auto' ? val + 'px' : val + unit
}

function selectUnit(unit: string) {
  unitOpen.value = false
  if (unit === 'auto') {
    model.value = 'auto'
    return
  }
  const num = parsed.value.num
  model.value = num ? num + unit : ''
}

function handleKeydown(e: KeyboardEvent) {
  stepUnitValue(e, parsed.value.unit, (value) => { model.value = value })
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

    <PopoverUi v-model:open="unitOpen" align="right" panel-class="min-w-14 p-0.5 rounded-lg">
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
  </div>
</template>
