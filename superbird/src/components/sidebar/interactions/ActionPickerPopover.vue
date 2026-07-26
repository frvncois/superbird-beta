<script setup lang="ts">
import { computed } from 'vue'
import { ACTION_PROPERTIES } from '@/constants/canvas'
import type { ActionProperty, ClassOp } from '@/types/canvas'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'

defineProps<{
  position: { x: number; y: number }
}>()

// Emit either an animate property or a class operation.
const emit = defineEmits<{
  select: [choice: { kind: 'animate'; property: ActionProperty } | { kind: 'class'; op: ClassOp }]
  close: []
}>()

const actionGroups = computed(() => {
  const groups: Record<string, typeof ACTION_PROPERTIES> = {}
  for (const prop of ACTION_PROPERTIES) {
    ;(groups[prop.group] ??= []).push(prop)
  }
  return groups
})

const classOps: { op: ClassOp; label: string }[] = [
  { op: 'add', label: 'Add class' },
  { op: 'remove', label: 'Remove class' },
  { op: 'toggle', label: 'Toggle class' },
]
</script>

<!--
  Teleported dropdown of animate properties (grouped) plus class operations.
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
        <LabelUi size="xs" class="block px-2 pt-1.5 pb-0.5 text-secondary/50">{{ group }}</LabelUi>
        <ButtonUi
          v-for="prop in items"
          :key="prop.key"
          variant="ghost"
          align="start"
          size="sm"
          class="w-full rounded-lg px-2 text-[10px]"
          @click="emit('select', { kind: 'animate', property: prop.key })"
        >
          {{ prop.label }}
        </ButtonUi>
      </template>

      <!-- Class operations (purple, like other class affordances) -->
      <LabelUi size="xs" class="block px-2 pt-1.5 pb-0.5 text-purple-fg/70">Class</LabelUi>
      <ButtonUi
        v-for="c in classOps"
        :key="c.op"
        variant="ghost"
        align="start"
        size="sm"
        class="w-full rounded-lg px-2 text-[10px] text-purple-fg hover:bg-purple-bg/40"
        @click="emit('select', { kind: 'class', op: c.op })"
      >
        {{ c.label }}
      </ButtonUi>
    </div>
  </Teleport>
</template>
