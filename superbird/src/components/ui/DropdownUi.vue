<script lang="ts">
// One menu row. `separator: true` renders a divider instead of a button.
export interface DropdownItem {
  label?: string
  icon?: string
  danger?: boolean
  separator?: boolean
  handler?: () => void
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import IconUi from './IconUi.vue'
import ButtonUi from './ButtonUi.vue'

withDefaults(
  defineProps<{
    label?: string
    icon?: string
    items?: DropdownItem[]
    panelClass?: string
    // Width of the whole control (trigger + panel share one border). A Tailwind
    // width utility — override for wider content panels.
    width?: string
  }>(),
  {
    label: '',
    icon: '',
    items: () => [],
    panelClass: '',
    width: 'w-49',
  },
)

const open = defineModel<boolean>('open', { default: false })
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
function select(item: DropdownItem) {
  item.handler?.()
  close()
}

function onPointer(e: PointerEvent) {
  const target = e.target as Node | null
  if (!root.value || root.value.contains(target)) return
  // Content teleported out of the panel (submenus, flyouts, nested popovers) can
  // opt to keep the dropdown open by marking a `data-dropdown-keep` ancestor.
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
  <div ref="root" class="relative h-8" :class="width">
    <div
      class="absolute inset-x-0 top-0 z-50 overflow-hidden rounded-xl border bg-background transition-all duration-200 ease-out"
      :class="open ? 'border-input-border-focus shadow-lg' : ''"
    >
      <slot name="trigger" :open="open" :toggle="toggle">
        <button class="flex h-8 w-full items-center justify-between gap-1.5 px-3 text-xs cursor-pointer" @click="toggle">
          <span class="flex min-w-0 items-center gap-3">
            <IconUi v-if="icon" :name="icon" size="size-3.5" class="shrink-0 text-secondary" />
            <span class="truncate font-medium">{{ label }}</span>
          </span>
          <IconUi name="chevron-down" size="size-3" :class="['shrink-0 text-secondary transition-transform duration-150', open && 'rotate-180']" />
        </button>
      </slot>

      <!-- Panel unfolds (0fr → 1fr) inside the shared border. -->
      <div class="grid transition-all duration-200 ease-out" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
        <div class="overflow-hidden">
          <div :class="['flex flex-col p-1', panelClass]">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
