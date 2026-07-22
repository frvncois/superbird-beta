<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import IconUi from './IconUi.vue'

const props = withDefaults(
  defineProps<{
    options: { value: string; label: string }[]
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

const selectedLabel = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? '',
)

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
      <span :class="['min-w-0 flex-1 truncate text-left', selectedLabel ? 'text-foreground' : 'text-foreground/40']">
        {{ selectedLabel || placeholder }}
      </span>
      <IconUi
        name="chevron-down"
        size="size-3"
        :class="['shrink-0 text-secondary transition-transform duration-200', open && 'rotate-180']"
      />
    </button>

    <!-- Click-away backdrop -->
    <div v-if="open" class="fixed inset-0 z-40" @mousedown="close" />

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
    >
      <div
        v-if="open"
        ref="panelRef"
        role="listbox"
        class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 origin-top overflow-y-auto rounded-xl border bg-background p-1 shadow-lg"
      >
        <button
          v-for="(opt, i) in options"
          :key="opt.value"
          type="button"
          role="option"
          :aria-selected="opt.value === model"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
            opt.value === model
              ? 'bg-primary/10 font-medium text-primary'
              : i === highlighted
                ? 'bg-secondary/10 text-foreground'
                : 'text-foreground hover:bg-secondary/10',
          ]"
          @mousedown.prevent="select(opt.value)"
          @mouseenter="highlighted = i"
        >
          <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
          <IconUi v-if="opt.value === model" name="check" size="size-3" class="shrink-0 text-primary" />
        </button>
      </div>
    </Transition>
  </div>
</template>
