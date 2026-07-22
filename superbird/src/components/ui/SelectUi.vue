<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import IconUi from './IconUi.vue'
import PopoverUi from './PopoverUi.vue'

interface SelectOption {
  value: string
  label: string
  // Optional per-option affordances (e.g. a highlighted "dynamic" choice).
  icon?: string
  accentClass?: string
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Select…',
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })

const open = ref(false)
const highlighted = ref(-1)
const panelRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => props.options.find((o) => o.value === model.value))
const selectedLabel = computed(() => selectedOption.value?.label ?? '')

function toggle() {
  if (props.disabled) return
  open.value ? close() : openMenu()
}

function openMenu() {
  open.value = true
  highlighted.value = props.options.findIndex((o) => o.value === model.value)
  scrollToHighlighted()
}

function close() {
  open.value = false
}

function select(value: string) {
  model.value = value
  close()
}

function scrollToHighlighted() {
  nextTick(() => {
    const panel = panelRef.value
    if (!panel || highlighted.value < 0) return
    const el = panel.children[highlighted.value] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function move(delta: number) {
  const count = props.options.length
  if (!count) return
  const start = highlighted.value < 0 ? (delta > 0 ? -1 : 0) : highlighted.value
  highlighted.value = (start + delta + count) % count
  scrollToHighlighted()
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      open.value ? move(1) : openMenu()
      break
    case 'ArrowUp':
      e.preventDefault()
      open.value ? move(-1) : openMenu()
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (!open.value) openMenu()
      else if (highlighted.value >= 0) select(props.options[highlighted.value]!.value)
      break
    case 'Escape':
      if (open.value) {
        e.preventDefault()
        close()
      }
      break
    case 'Tab':
      close()
      break
  }
}

watch(highlighted, scrollToHighlighted)
</script>

<template>
  <div class="relative w-full min-w-0">
    <!-- Trigger -->
    <button
      type="button"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :class="[
        'flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg bg-input border px-2.5 text-xs outline-3 outline-transparent transition-colors duration-150',
        open ? 'border-foreground/40 outline-secondary/10' : 'border-foreground/15',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-foreground/25',
      ]"
      @click="toggle"
      @keydown="onKeydown"
      @blur="close"
    >
      <IconUi
        v-if="selectedOption?.icon"
        :name="selectedOption.icon"
        size="size-3"
        :class="['shrink-0', selectedOption.accentClass ?? 'text-secondary']"
      />
      <span
        :class="[
          'min-w-0 flex-1 truncate text-left',
          selectedOption?.accentClass ?? (selectedLabel ? 'text-foreground' : 'text-foreground/40'),
        ]"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <IconUi
        name="chevron-down"
        size="size-3"
        :class="['shrink-0 text-secondary transition-transform duration-200', open && 'rotate-180']"
      />
    </button>

    <!-- Dropdown panel -->
    <PopoverUi v-model:open="open" align="full" transition="scale" panel-class="">
      <div ref="panelRef" role="listbox" class="max-h-60 overflow-y-auto p-1">
        <button
          v-for="(opt, i) in options"
          :key="opt.value"
          type="button"
          role="option"
          :aria-selected="opt.value === model"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
            opt.value === model ? 'bg-primary/10 font-medium' : i === highlighted ? 'bg-secondary/10' : 'hover:bg-secondary/10',
            opt.accentClass ?? (opt.value === model ? 'text-primary' : 'text-foreground'),
          ]"
          @mousedown.prevent="select(opt.value)"
          @mouseenter="highlighted = i"
        >
          <IconUi v-if="opt.icon" :name="opt.icon" size="size-3" class="shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
          <IconUi v-if="opt.value === model" name="check" size="size-3" class="shrink-0" />
        </button>
      </div>
    </PopoverUi>
  </div>
</template>
