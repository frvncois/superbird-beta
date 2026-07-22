<script setup lang="ts">
import { computed, useSlots } from 'vue'
import IconUi from './IconUi.vue'

// A dashboard card: [icon + title] header, content (default slot), and an
// optional actions footer. All three regions are optional.
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    // Tailwind classes for the header icon chip (bg + text color pair).
    iconClass?: string
  }>(),
  {
    iconClass: 'bg-foreground/5 text-secondary',
  },
)

const slots = useSlots()
const hasHeader = computed(() => !!(slots.title || slots.icon || slots['header-actions']))
</script>

<template>
  <section class="flex flex-col rounded-2xl border bg-background shadow-sm">
    <!-- Header: icon + title (+ optional trailing actions) -->
    <header v-if="title || icon || hasHeader" class="flex items-center gap-2.5 px-4 pt-4 pb-3">
      <span
        v-if="icon || slots.icon"
        :class="['flex size-8 shrink-0 items-center justify-center rounded-lg', iconClass]"
      >
        <slot name="icon"><IconUi v-if="icon" :name="icon" size="size-4" /></slot>
      </span>
      <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        <slot name="title">{{ title }}</slot>
      </h3>
      <div v-if="slots['header-actions']" class="flex shrink-0 items-center gap-1">
        <slot name="header-actions" />
      </div>
    </header>

    <!-- Content -->
    <div :class="['flex-1 px-4', title || icon || hasHeader ? 'pb-4' : 'py-4']">
      <slot />
    </div>

    <!-- Actions -->
    <footer v-if="slots.actions" class="flex items-center gap-2 border-t px-4 py-2.5">
      <slot name="actions" />
    </footer>
  </section>
</template>
