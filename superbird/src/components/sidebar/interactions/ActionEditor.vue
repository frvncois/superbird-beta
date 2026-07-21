<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { ACTION_PROPERTIES } from '@/constants/canvas'
import type { InteractionAction } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  nodeId: string
  ixId: string
  stepId: string
  action: InteractionAction
  index: number
}>()

const store = useCanvasStore()

const propertyLabel = computed(
  () => ACTION_PROPERTIES.find((p) => p.key === props.action.property)?.label,
)

const isColorAction = computed(
  () => props.action.property === 'background-color' || props.action.property === 'color',
)

function updateAction(updates: Partial<InteractionAction>) {
  store.updateActionInStep(props.nodeId, props.ixId, props.stepId, props.index, updates)
}

function removeAction() {
  store.removeActionFromStep(props.nodeId, props.ixId, props.stepId, props.index)
}
</script>

<template>
  <div class="flex items-center gap-1 rounded-lg bg-secondary/5 px-2 py-1.5">
    <span class="w-12 text-[9px] font-mono text-secondary shrink-0 truncate">{{ propertyLabel }}</span>
    <template v-if="isColorAction">
      <ColorInputUi
        :model-value="action.from"
        placeholder="from"
        @update:model-value="updateAction({ from: $event })"
      />
      <span class="text-[9px] text-secondary">→</span>
      <ColorInputUi
        :model-value="action.to"
        placeholder="to"
        @update:model-value="updateAction({ to: $event })"
      />
    </template>
    <template v-else>
      <InputUi
        :model-value="action.from"
        size="xs"
        placeholder="from"
        class="flex-1"
        @update:model-value="(v: string) => updateAction({ from: v })"
      />
      <span class="text-[9px] text-secondary shrink-0">→</span>
      <InputUi
        :model-value="action.to"
        size="xs"
        placeholder="to"
        class="flex-1"
        @update:model-value="(v: string) => updateAction({ to: v })"
      />
    </template>
    <IconButtonUi size="xs" variant="danger" title="Remove action" @click="removeAction">
      <IconUi name="close" size="size-2.5" />
    </IconButtonUi>
  </div>
</template>
