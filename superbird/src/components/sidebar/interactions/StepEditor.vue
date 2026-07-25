<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { TARGET_TYPES, EASING_OPTIONS, ACTION_PROPERTIES } from '@/constants/canvas'
import type { InteractionStep, TargetType, ActionProperty, ClassOp } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import ActionEditor from './ActionEditor.vue'
import ActionPickerPopover from './ActionPickerPopover.vue'

const props = defineProps<{
  nodeId: string
  ixId: string
  step: InteractionStep
  index: number
}>()

const store = useCanvasStore()

const targetOptions = TARGET_TYPES.map((t) => ({ value: t.key, label: t.label }))
const easingOptions = EASING_OPTIONS.map((e) => ({ value: e.key, label: e.label }))

function updateStep(updates: Partial<Pick<InteractionStep, 'target' | 'delay' | 'duration' | 'easing' | 'stagger'>>) {
  store.updateStep(props.nodeId, props.ixId, props.step.id, updates)
}
function removeStep() {
  store.removeStep(props.nodeId, props.ixId, props.step.id)
}

// Action picker
const showActionPicker = ref(false)
const pickerPos = ref({ x: 0, y: 0 })
function openActionPicker(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  pickerPos.value = { x: rect.right, y: rect.bottom + 4 }
  showActionPicker.value = !showActionPicker.value
}
function addAction(choice: { kind: 'animate'; property: ActionProperty } | { kind: 'class'; op: ClassOp }) {
  if (choice.kind === 'class') {
    store.addActionToStep(props.nodeId, props.ixId, props.step.id, {
      type: 'class',
      op: choice.op,
      className: '',
    })
  } else {
    const property = choice.property
    const prop = ACTION_PROPERTIES.find((p) => p.key === property)
    const base = property.includes('scale') ? '1' : '0' + (prop?.unit ?? '')
    store.addActionToStep(props.nodeId, props.ixId, props.step.id, {
      property,
      from: property === 'opacity' ? '0' : base,
      to: property === 'opacity' ? '1' : base,
    })
  }
  showActionPicker.value = false
}
</script>

<template>
  <PropertySectionUi :title="`Step ${index + 1}`" icon="effects">
    <div class="space-y-2">
      <!-- Target -->
      <FieldRowUi label="Target" label-width="sm">
        <DropdownUi
          class="w-full"
          :model-value="step.target.type"
          :options="targetOptions"
          @update:model-value="(v: string) => updateStep({ target: { type: v as TargetType, value: step.target.value } })"
        />
      </FieldRowUi>
      <FieldRowUi
        v-if="step.target.type === 'class' || step.target.type === 'id' || step.target.type === 'child'"
        label="Value"
        label-width="sm"
      >
        <InputUi
          :model-value="step.target.value ?? ''"
          :placeholder="step.target.type === 'class' ? '.class-name' : step.target.type === 'id' ? '#element-id' : 'Child label'"
          @update:model-value="(v: string) => updateStep({ target: { type: step.target.type, value: v } })"
        />
      </FieldRowUi>

      <!-- Timing -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="space-y-0.5">
          <LabelUi size="xs">Delay</LabelUi>
          <InputUi type="number" :model-value="String(step.delay)" @update:model-value="(v: string) => updateStep({ delay: Number(v) })" />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Duration</LabelUi>
          <InputUi type="number" :model-value="String(step.duration)" @update:model-value="(v: string) => updateStep({ duration: Number(v) })" />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Stagger</LabelUi>
          <InputUi type="number" :model-value="String(step.stagger ?? 0)" @update:model-value="(v: string) => updateStep({ stagger: Number(v) || undefined })" />
        </div>
      </div>

      <!-- Easing -->
      <FieldRowUi label="Easing" label-width="sm">
        <DropdownUi class="w-full" :model-value="step.easing" :options="easingOptions" @update:model-value="(v: string) => updateStep({ easing: v })" />
      </FieldRowUi>

      <!-- Actions -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between">
          <LabelUi size="xs">Actions</LabelUi>
          <ButtonUi
            variant="ghost"
            size="sm"
            icon="add"
            class="gap-0.5 text-[10px] text-secondary hover:text-foreground"
            @click.stop="openActionPicker"
          >
            Add
          </ButtonUi>
        </div>
        <ActionEditor
          v-for="(action, aIdx) in step.actions"
          :key="aIdx"
          :node-id="nodeId"
          :ix-id="ixId"
          :step-id="step.id"
          :action="action"
          :index="aIdx"
        />
      </div>

      <!-- Remove step -->
      <ButtonUi variant="danger" size="sm" icon="delete" class="w-full" @click="removeStep">Remove step</ButtonUi>
    </div>

    <ActionPickerPopover
      v-if="showActionPicker"
      :position="pickerPos"
      @select="addAction"
      @close="showActionPicker = false"
    />
  </PropertySectionUi>
</template>
