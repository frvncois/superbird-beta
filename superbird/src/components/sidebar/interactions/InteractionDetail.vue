<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { TRIGGER_TYPES } from '@/constants/canvas'
import type { Interaction, TriggerType } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import StepEditor from './StepEditor.vue'

const props = defineProps<{
  nodeId: string
  interaction: Interaction
}>()

defineEmits<{ back: [] }>()

const store = useCanvasStore()
const triggerOptions = TRIGGER_TYPES.map((t) => ({ value: t.key, label: t.label }))

function updateInteraction(updates: Partial<Pick<Interaction, 'name' | 'trigger' | 'triggerValue' | 'options'>>) {
  store.updateInteraction(props.nodeId, props.interaction.id, updates)
}
function addStep() {
  store.addStep(props.nodeId, props.interaction.id)
}
</script>

<template>
  <div>
    <!-- Header: back + interaction name (like the Settings/Properties top block) -->
    <div class="space-y-3 p-4">
      <ButtonUi
        variant="ghost"
        size="sm"
        class="gap-1 text-secondary hover:text-foreground"
        @click="$emit('back')"
      >
        <IconUi name="chevron-down" size="size-3" class="rotate-90" />
        Interactions
      </ButtonUi>
      <div class="flex items-center gap-2">
        <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-bg text-amber-fg">
          <IconUi name="interactions" size="size-3.5" />
        </span>
        <InputUi
          :model-value="interaction.name"
          placeholder="Interaction name"
          @update:model-value="(v: string) => updateInteraction({ name: v })"
        />
      </div>
    </div>

    <!-- Accordion sections -->
    <div class="border-y">
      <PropertySectionUi title="Trigger" icon="settings">
        <div class="space-y-1.5">
          <FieldRowUi label="Type" label-width="sm">
            <SelectUi
              :model-value="interaction.trigger"
              :options="triggerOptions"
              @update:model-value="(v: string) => updateInteraction({ trigger: v as TriggerType })"
            />
          </FieldRowUi>
          <label class="flex cursor-pointer items-center justify-between pt-1">
            <span class="text-xs text-foreground">Loop</span>
            <ToggleUi
              :model-value="interaction.options.loop ?? false"
              @update:model-value="(v: boolean) => updateInteraction({ options: { ...interaction.options, loop: v } })"
            />
          </label>
          <label
            v-if="interaction.trigger === 'hover' || interaction.trigger === 'scroll-into-view'"
            class="flex cursor-pointer items-center justify-between"
          >
            <span class="text-xs text-foreground">Reset on exit</span>
            <ToggleUi
              :model-value="interaction.options.resetOnExit ?? false"
              @update:model-value="(v: boolean) => updateInteraction({ options: { ...interaction.options, resetOnExit: v } })"
            />
          </label>
        </div>
      </PropertySectionUi>

      <StepEditor
        v-for="(step, i) in interaction.steps"
        :key="step.id"
        :node-id="nodeId"
        :ix-id="interaction.id"
        :step="step"
        :index="i"
      />
    </div>

    <!-- Add step -->
    <div class="p-4">
      <ButtonUi
        variant="outline"
        size="sm"
        icon="add"
        class="w-full rounded-xl border-dashed border-foreground/15 py-2.5 text-secondary hover:border-foreground/30 hover:text-foreground"
        @click="addStep"
      >
        Add step
      </ButtonUi>
    </div>
  </div>
</template>
