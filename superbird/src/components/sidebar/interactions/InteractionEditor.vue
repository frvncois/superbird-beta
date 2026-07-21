<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { TRIGGER_TYPES } from '@/constants/canvas'
import type { Interaction, TriggerType } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import StepEditor from './StepEditor.vue'

const props = defineProps<{
  nodeId: string
  interaction: Interaction
  expandedStepId: string | null
}>()

const emit = defineEmits<{
  toggleStep: [stepId: string]
  addStep: []
  removeStep: [stepId: string]
  openActionPicker: [e: MouseEvent, stepId: string]
}>()

const store = useCanvasStore()

const triggerOptions = TRIGGER_TYPES.map((t) => ({ value: t.key, label: t.label }))

function updateInteraction(
  updates: Partial<Pick<Interaction, 'name' | 'trigger' | 'triggerValue' | 'options'>>,
) {
  store.updateInteraction(props.nodeId, props.interaction.id, updates)
}
</script>

<template>
  <div class="border-t border-foreground/8 px-3 py-2 space-y-3">
    <!-- Trigger config -->
    <div class="space-y-1.5">
      <LabelUi>Trigger</LabelUi>
      <FieldRowUi label="Type" label-width="sm">
        <SelectUi
          :model-value="interaction.trigger"
          :options="triggerOptions"
          @update:model-value="(v: string) => updateInteraction({ trigger: v as TriggerType })"
        />
      </FieldRowUi>
      <FieldRowUi label="Name" label-width="sm">
        <InputUi
          :model-value="interaction.name"
          placeholder="Interaction name"
          @update:model-value="(v: string) => updateInteraction({ name: v })"
        />
      </FieldRowUi>
    </div>

    <!-- Options -->
    <div class="space-y-1.5">
      <LabelUi>Options</LabelUi>
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-foreground">Loop</span>
        <ToggleUi
          :model-value="interaction.options.loop ?? false"
          @update:model-value="(v: boolean) => updateInteraction({ options: { ...interaction.options, loop: v } })"
        />
      </label>
      <label
        v-if="interaction.trigger === 'hover' || interaction.trigger === 'scroll-into-view'"
        class="flex items-center justify-between cursor-pointer"
      >
        <span class="text-xs text-foreground">Reset on exit</span>
        <ToggleUi
          :model-value="interaction.options.resetOnExit ?? false"
          @update:model-value="(v: boolean) => updateInteraction({ options: { ...interaction.options, resetOnExit: v } })"
        />
      </label>
    </div>

    <!-- Steps -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <LabelUi>Steps</LabelUi>
        <button
          class="flex items-center gap-0.5 text-[10px] text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
          @click="emit('addStep')"
        >
          <IconUi name="add" size="size-3" />
          Add
        </button>
      </div>

      <!-- Step list -->
      <StepEditor
        v-for="(step, sIdx) in interaction.steps"
        :key="step.id"
        :node-id="nodeId"
        :ix-id="interaction.id"
        :step="step"
        :index="sIdx"
        :expanded="expandedStepId === step.id"
        @toggle="emit('toggleStep', step.id)"
        @remove="emit('removeStep', step.id)"
        @open-action-picker="(e: MouseEvent) => emit('openActionPicker', e, step.id)"
      />
    </div>
  </div>
</template>
