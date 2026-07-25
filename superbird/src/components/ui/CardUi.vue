<script setup lang="ts">
import { useSlots } from 'vue'
import IconUi from './IconUi.vue'

// Card surface with three regions: Header, Content (default slot), and an
// optional Actions footer. The header defaults to the dashboard-card layout
// (inverted icon chip + title + header-action), or pass a `#header` slot for
// full control (e.g. a title + subtitle).
withDefaults(
  defineProps<{
    icon?: string
    title?: string
    // Optional subtitle under the title in the header.
    description?: string
    // 'sm' is a compact card (tighter padding + region gap) for dense stacks.
    size?: 'default' | 'sm'
    // Content padding/typography. Defaults to the dashboard-card look; screens
    // that need a plainer body override it.
    bodyClass?: string
  }>(),
  {
    size: 'default',
    bodyClass: 'text-xs',
  },
)

const slots = useSlots()
</script>

<template>
  <section
    :class="[
      'flex flex-col overflow-hidden rounded-xl shadow-xl/2 bg-card border animate-fade-in-up',
      size === 'sm' ? 'gap-3.5 p-3.5' : 'gap-6 p-6',
    ]"
  >
    <!-- Header -->
    <header v-if="slots.header || title || description || icon || slots.icon || slots['header-action']">
      <slot name="header">
        <div class="flex items-center gap-3.5">
          <span
            v-if="icon || slots.icon"
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background"
          >
            <slot name="icon"><IconUi v-if="icon" :name="icon" size="size-3.5" /></slot>
          </span>
          <div class="min-w-0 flex-1">
            <p v-if="title" class="truncate text-sm font-medium text-foreground">{{ title }}</p>
            <p v-if="description" class="text-xs text-secondary">{{ description }}</p>
          </div>
          <div v-if="slots['header-action']" class="flex shrink-0 items-center">
            <slot name="header-action" />
          </div>
        </div>
      </slot>
    </header>

    <!-- Content -->
    <div :class="bodyClass">
      <slot />
    </div>

    <!-- Actions -->
    <footer v-if="slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </footer>
  </section>
</template>
