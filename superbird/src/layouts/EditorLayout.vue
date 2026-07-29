<script setup lang="ts">
import { computed } from 'vue'

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
  <div class="grid h-full w-full transition-[grid-template-columns] duration-200 ease-[ease] px-3.5" :style="{ gridTemplateColumns }">
    <aside v-show="!contentMode" class="col-start-1 relative z-30 overflow-hidden pr-3.5">
      <slot name="sidebar-left" />
    </aside>

    <main class="col-start-2 relative z-0 isolate overflow-auto border rounded-xl mb-3.5">
      <slot name="canvas" />
    </main>

    <aside v-show="!contentMode" class="col-start-3 relative z-30 overflow-hidden pl-3.5">
      <slot name="sidebar-right" />
    </aside>
  </div>
</template>
