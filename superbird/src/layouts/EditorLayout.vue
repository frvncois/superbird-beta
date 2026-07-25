<script setup lang="ts">
import { computed } from 'vue'

// Editor body grid (left | canvas | right). Header is owned by AppShell. Each
// rail collapses to a thin strip; content-mode hides both rails entirely.
const props = defineProps<{
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  contentMode?: boolean
}>()

const gridTemplateColumns = computed(() =>
  props.contentMode
    ? '0 1fr 0'
    : `${props.leftCollapsed ? '44px' : 'var(--sidebar-width)'} 1fr ${props.rightCollapsed ? '44px' : 'var(--sidebar-width)'}`,
)
</script>

<template>
  <div class="grid h-full w-full transition-[grid-template-columns] duration-200 ease-[ease]" :style="{ gridTemplateColumns }">
    <aside v-show="!contentMode" class="col-start-1 relative z-30 overflow-hidden">
      <slot name="sidebar-left" />
    </aside>

    <!--
      The canvas is `isolate`d into its own stacking context pinned at z-0, so a
      user element's z-index (even a sticky site header) can never escape above the
      sidebars/header and their dropdowns. `col-start-*` pins each rail to its
      column so `v-show` (display:none) can't shift auto-placement.
    -->
    <main class="col-start-2 relative z-0 isolate overflow-auto border rounded-xl mb-3.5">
      <slot name="canvas" />
    </main>

    <aside v-show="!contentMode" class="col-start-3 relative z-30 overflow-hidden">
      <slot name="sidebar-right" />
    </aside>
  </div>
</template>
