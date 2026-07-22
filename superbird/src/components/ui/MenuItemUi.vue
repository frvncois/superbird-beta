<script setup lang="ts">
import IconUi from './IconUi.vue'

// The shared row shell used by dropdowns, popovers and context menus: hover
// state, active (selected) highlight, danger and disabled variants, an optional
// leading icon (with optional reserved space so labels align across a mixed
// list), a label slot, and a `trailing` slot for a shortcut / check / badge.
withDefaults(
  defineProps<{
    active?: boolean
    danger?: boolean
    disabled?: boolean
    icon?: string
    // Always render the leading icon box, even without an icon, so items with
    // and without icons line up (context menus).
    reserveIcon?: boolean
  }>(),
  { active: false, danger: false, disabled: false, reserveIcon: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
      disabled
        ? 'text-secondary/40 cursor-default'
        : danger
          ? 'text-red-fg hover:bg-red-bg cursor-pointer'
          : active
            ? 'bg-primary/10 text-primary font-medium cursor-pointer'
            : 'text-foreground hover:bg-secondary/10 cursor-pointer',
    ]"
  >
    <span v-if="reserveIcon" class="flex size-4 shrink-0 items-center justify-center">
      <IconUi v-if="icon" :name="icon" size="size-3.5" />
    </span>
    <IconUi v-else-if="icon" :name="icon" size="size-3.5" class="shrink-0" />
    <span class="min-w-0 flex-1 truncate"><slot /></span>
    <slot name="trailing" />
  </button>
</template>
