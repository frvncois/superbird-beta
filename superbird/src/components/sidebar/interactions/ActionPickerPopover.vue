<script setup lang="ts">
import { computed } from 'vue'
import { ACTION_PROPERTIES } from '@/constants/canvas'
import type { ActionProperty } from '@/types/canvas'

defineProps<{
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  select: [property: ActionProperty]
  close: []
}>()

// Group action properties
const actionGroups = computed(() => {
  const groups: Record<string, typeof ACTION_PROPERTIES> = {}
  for (const prop of ACTION_PROPERTIES) {
    ;(groups[prop.group] ??= []).push(prop)
  }
  return groups
})
</script>

<!--
  Teleported dropdown listing action properties grouped by category.
  Rendered to <body> so it layers above the sidebar overflow.
-->
<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9998]" @click="emit('close')" />
    <div
      class="fixed z-[9999] w-36 max-h-64 overflow-y-auto rounded-xl border bg-background p-1 shadow-lg"
      :style="{ left: `${position.x - 144}px`, top: `${position.y}px` }"
    >
      <template v-for="(items, group) in actionGroups" :key="group">
        <div class="px-2 pt-1.5 pb-0.5 text-[8px] font-mono uppercase tracking-wider text-secondary/50">{{ group }}</div>
        <button
          v-for="prop in items"
          :key="prop.key"
          class="flex w-full items-center rounded-lg px-2 py-1 text-[10px] cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
          @click="emit('select', prop.key)"
        >
          {{ prop.label }}
        </button>
      </template>
    </div>
  </Teleport>
</template>
