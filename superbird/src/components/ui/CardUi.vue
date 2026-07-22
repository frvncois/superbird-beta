<script setup lang="ts">
import { useSlots } from 'vue'
import IconUi from './IconUi.vue'

// Dashboard card: subtle tinted surface, inverted icon chip, [icon + title +
// header-action] header, content (default slot), and an optional actions
// footer.
withDefaults(
  defineProps<{
    icon?: string
    title?: string
  }>(),
  {},
)

const slots = useSlots()
</script>

<template>
  <section class="flex flex-col overflow-hidden rounded-lg bg-muted-bg">
    <!-- Header -->
    <header v-if="title || icon || slots['header-action']" class="flex items-center gap-2.5 p-3">
      <span
        v-if="icon"
        class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background"
      >
        <IconUi :name="icon" size="size-3.5" />
      </span>
      <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{{ title }}</p>
      <div v-if="slots['header-action']" class="flex shrink-0 items-center">
        <slot name="header-action" />
      </div>
    </header>

    <!-- Content -->
    <div class="px-3 pb-3 text-xs text-secondary">
      <slot />
    </div>

    <!-- Actions -->
    <footer v-if="slots.actions" class="flex items-center gap-2 px-3 pb-3">
      <slot name="actions" />
    </footer>
  </section>
</template>
