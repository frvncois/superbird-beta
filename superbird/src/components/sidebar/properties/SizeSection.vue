<script setup lang="ts">
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import DragLabelUi from '@/components/ui/DragLabelUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, statesWithValues } = useNodeStyles()

const sizeKeys = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']
</script>

<template>
  <PropertySectionUi title="Size" icon="size" :states-with-values="statesWithValues(sizeKeys)">
    <div class="grid grid-cols-2 gap-1.5">
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.width ?? ''" @update:model-value="updateStyle('width', $event)">Width</DragLabelUi>
        <UnitInputUi :model-value="activeStyles.width ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('width', $event)" />
      </div>
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.height ?? ''" @update:model-value="updateStyle('height', $event)">Height</DragLabelUi>
        <UnitInputUi :model-value="activeStyles.height ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('height', $event)" />
      </div>
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['min-width'] ?? ''" @update:model-value="updateStyle('min-width', $event)">Min W</DragLabelUi>
        <UnitInputUi :model-value="activeStyles['min-width'] ?? ''" placeholder="0" @update:model-value="updateStyle('min-width', $event)" />
      </div>
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['min-height'] ?? ''" @update:model-value="updateStyle('min-height', $event)">Min H</DragLabelUi>
        <UnitInputUi :model-value="activeStyles['min-height'] ?? ''" placeholder="0" @update:model-value="updateStyle('min-height', $event)" />
      </div>
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['max-width'] ?? ''" @update:model-value="updateStyle('max-width', $event)">Max W</DragLabelUi>
        <UnitInputUi :model-value="activeStyles['max-width'] ?? ''" placeholder="0" @update:model-value="updateStyle('max-width', $event)" />
      </div>
      <div class="space-y-1">
        <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['max-height'] ?? ''" @update:model-value="updateStyle('max-height', $event)">Max H</DragLabelUi>
        <UnitInputUi :model-value="activeStyles['max-height'] ?? ''" placeholder="0" @update:model-value="updateStyle('max-height', $event)" />
      </div>
    </div>
  </PropertySectionUi>
</template>
