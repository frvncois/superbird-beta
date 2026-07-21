<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import type { Interaction } from '@/types/canvas'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import InteractionEditor from './InteractionEditor.vue'

const props = defineProps<{
  interactions: Interaction[]
  nodeId: string
  expandedIxId: string | null
  expandedStepId: string | null
}>()

const emit = defineEmits<{
  toggleIx: [ixId: string]
  toggleStep: [stepId: string]
  addStep: [ixId: string]
  removeStep: [ixId: string, stepId: string]
  openActionPicker: [e: MouseEvent, ixId: string, stepId: string]
}>()

const store = useCanvasStore()

function removeInteraction(ixId: string) {
  store.removeInteraction(props.nodeId, ixId)
}
</script>

<template>
  <div
    v-for="ix in interactions"
    :key="ix.id"
    class="rounded-xl border border-foreground/10 overflow-hidden"
  >
    <!-- Interaction header -->
    <div
      class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/5 transition-colors duration-100"
      @click="emit('toggleIx', ix.id)"
    >
      <IconUi
        name="chevron-right"
        :size="`size-3 text-secondary transition-transform duration-150${expandedIxId === ix.id ? ' rotate-90' : ''}`"
      />
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium truncate">{{ ix.name }}</div>
        <div class="text-[9px] text-secondary font-mono">{{ ix.trigger }} · {{ ix.steps.length }} steps</div>
      </div>
      <IconButtonUi size="sm" variant="danger" title="Remove interaction" @click.stop="removeInteraction(ix.id)">
        <IconUi name="close" size="size-3" />
      </IconButtonUi>
    </div>

    <!-- Interaction body -->
    <InteractionEditor
      v-if="expandedIxId === ix.id"
      :node-id="nodeId"
      :interaction="ix"
      :expanded-step-id="expandedStepId"
      @toggle-step="(stepId: string) => emit('toggleStep', stepId)"
      @add-step="emit('addStep', ix.id)"
      @remove-step="(stepId: string) => emit('removeStep', ix.id, stepId)"
      @open-action-picker="(e: MouseEvent, stepId: string) => emit('openActionPicker', e, ix.id, stepId)"
    />
  </div>
</template>
