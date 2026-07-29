<script lang="ts">
export interface DropdownItem {
  label?: string
  icon?: string
  danger?: boolean
  separator?: boolean
  handler?: () => void
}

export interface DropdownOption {
  value: string
  label: string
  icon?: string
  accentClass?: string
  group?: string
  badge?: string
  labelStyle?: Record<string, string>
  labelClass?: string
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import IconUi from './IconUi.vue'
import ButtonUi from './ButtonUi.vue'
import BadgeUi from './BadgeUi.vue'
import LabelUi from './LabelUi.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    icon?: string
    items?: DropdownItem[]
    options?: DropdownOption[]
    placeholder?: string
    panelClass?: string
    disabled?: boolean
  }>(),
  {
    label: '',
    icon: '',
    items: () => [],
    options: () => [],
    placeholder: 'Select…',
    panelClass: '',
    disabled: false,
  },
)

const open = defineModel<boolean>('open', { default: false })
const model = defineModel<string>({ default: '' })
const root = ref<HTMLElement | null>(null)

const isSelect = computed(() => props.options.length > 0)
const selectedOption = computed(() => props.options.find((o) => o.value === model.value))
const isPlaceholder = computed(() => isSelect.value && !selectedOption.value)
const isDefaultSelected = computed(() => isSelect.value && !!selectedOption.value && model.value === '')

const triggerLabel = computed(() => (isSelect.value ? (selectedOption.value?.label ?? props.placeholder) : props.label))
const triggerIcon = computed(() => (isSelect.value ? selectedOption.value?.icon : props.icon))
const triggerAccent = computed(() => (isSelect.value ? selectedOption.value?.accentClass : undefined))
const triggerBadge = computed(() => (isSelect.value ? selectedOption.value?.badge : undefined))

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}
function close() {
  open.value = false
}
function select(item: DropdownItem) {
  item.handler?.()
  close()
}
function selectOption(opt: DropdownOption) {
  model.value = opt.value
  close()
}

function onPointer(e: PointerEvent) {
  const target = e.target as Node | null
  if (!root.value || root.value.contains(target)) return
  if (target instanceof Element && target.closest('[data-dropdown-keep]')) return
  close()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(open, (v) => {
  if (v) {
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
  } else {
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointer, true)
  document.removeEventListener('keydown', onKey)
})

defineExpose({ close })
</script>

<template>
  <div ref="root" class="relative h-8">
    <div
      class="absolute inset-x-0 top-0 overflow-hidden rounded-xl border bg-background transition-all duration-200 ease-out"
      :class="open ? 'z-50 border-input-border-focus shadow-xl' : 'z-10'"
    >
      <slot name="trigger" :open="open" :toggle="toggle">
        <button
          type="button"
          :disabled="disabled"
          class="flex h-8 w-full items-center justify-between gap-1.5 px-3 text-xs"
          :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
          @click="toggle"
        >
          <span class="flex min-w-0 items-center gap-2.5">
            <IconUi v-if="triggerIcon" :name="triggerIcon" size="size-3.5" :class="['shrink-0', triggerAccent ?? 'text-secondary']" />
            <span :class="['truncate', triggerAccent ?? (isPlaceholder ? 'text-foreground/40' : isDefaultSelected ? 'text-secondary/50' : isSelect ? 'text-foreground' : 'font-medium')]">
              {{ triggerLabel }}
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-2.5">
            <BadgeUi v-if="triggerBadge" variant="neutral" size="xs" mono>{{ triggerBadge }}</BadgeUi>
            <IconUi name="chevron-down" size="size-3" :class="['text-secondary transition-transform duration-150', open && 'rotate-180']" />
          </span>
        </button>
      </slot>

      <div class="grid transition-all duration-200 ease-out" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
        <div class="overflow-hidden">
          <div :class="['flex max-h-72 flex-col overflow-y-auto p-1', panelClass]">
            <template v-if="isSelect">
              <template v-for="(opt, i) in options" :key="opt.value">
                <LabelUi
                  v-if="opt.group && opt.group !== options[i - 1]?.group"
                  size="xs"
                  class="block px-2.5 pb-0.5 pt-2"
                >{{ opt.group }}</LabelUi>
                <ButtonUi
                  variant="ghost"
                  size="sm"
                  align="start"
                  class="w-full"
                  :class="opt.accentClass"
                  :active="opt.value === model"
                  :icon="opt.icon"
                  @click="selectOption(opt)"
                >
                  <span class="min-w-0 flex-1 truncate text-left" :class="opt.labelClass" :style="opt.labelStyle">{{ opt.label }}</span>
                  <BadgeUi v-if="opt.badge" variant="neutral" size="xs" mono class="shrink-0">{{ opt.badge }}</BadgeUi>
                  <IconUi v-if="opt.value === model" name="check" size="size-3" class="shrink-0" />
                </ButtonUi>
              </template>
              <slot name="footer" :close="close" />
            </template>

            <template v-else>
              <template v-for="(item, i) in items" :key="i">
                <div v-if="item.separator" class="my-1 border-t border-foreground/8" />
                <ButtonUi
                  v-else
                  variant="ghost"
                  size="sm"
                  align="start"
                  class="w-full"
                  :class="item.danger && 'text-red-fg hover:bg-red-bg'"
                  :icon="item.icon"
                  @click="select(item)"
                >
                  {{ item.label }}
                </ButtonUi>
              </template>
              <slot :close="close" />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
