<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import DragLabelUi from '@/components/ui/DragLabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { positionOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, statesWithValues } = useNodeStyles()

const positionKeys = ['position', 'top', 'right', 'bottom', 'left', 'z-index']
</script>

<template>
  <PropertySectionUi title="Position" icon="position" :states-with-values="statesWithValues(positionKeys)" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Position">
        <SelectUi :model-value="activeStyles.position ?? ''" :options="positionOptions" @update:model-value="updateStyle('position', $event)" />
      </FieldRowUi>
      <template v-if="activeStyles.position && activeStyles.position !== 'static' && activeStyles.position !== ''">
        <div class="grid grid-cols-2 gap-1.5">
          <div class="space-y-1">
            <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.top ?? ''" @update:model-value="updateStyle('top', $event)">Top</DragLabelUi>
            <UnitInputUi :model-value="activeStyles.top ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('top', $event)" />
          </div>
          <div class="space-y-1">
            <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.right ?? ''" @update:model-value="updateStyle('right', $event)">Right</DragLabelUi>
            <UnitInputUi :model-value="activeStyles.right ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('right', $event)" />
          </div>
          <div class="space-y-1">
            <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.bottom ?? ''" @update:model-value="updateStyle('bottom', $event)">Bottom</DragLabelUi>
            <UnitInputUi :model-value="activeStyles.bottom ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('bottom', $event)" />
          </div>
          <div class="space-y-1">
            <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.left ?? ''" @update:model-value="updateStyle('left', $event)">Left</DragLabelUi>
            <UnitInputUi :model-value="activeStyles.left ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('left', $event)" />
          </div>
        </div>
        <FieldRowUi label="Z-Index">
          <InputUi :model-value="activeStyles['z-index'] ?? ''" placeholder="auto" @update:model-value="updateStyle('z-index', $event)" />
        </FieldRowUi>
      </template>
    </div>
  </PropertySectionUi>
</template>
