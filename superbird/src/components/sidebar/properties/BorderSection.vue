<script setup lang="ts">
import { ref } from 'vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { borderStyleOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, updateLinkedStyles, getLinkedValues, statesWithValues } = useNodeStyles()

const borderKeys = ['border-width', 'border-style', 'border-color', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']

const borderSideOptions = [
  { value: 'all', label: 'All Sides' },
  { value: 'individual', label: 'Per Side' },
]

const activeBorderMode = ref('all')
</script>

<template>
  <PropertySectionUi title="Border" icon="border" :states-with-values="statesWithValues(borderKeys)">
    <div class="space-y-2">
      <SegmentedControlUi v-model="activeBorderMode" :options="borderSideOptions" size="xs" grow class="mb-2" />

      <template v-if="activeBorderMode === 'all'">
        <div class="space-y-1.5">
          <FieldRowUi label="Width">
            <UnitInputUi :model-value="activeStyles['border-width'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('border-width', $event)" />
          </FieldRowUi>
          <FieldRowUi label="Style">
            <SelectUi :model-value="activeStyles['border-style'] ?? ''" :options="borderStyleOptions" @update:model-value="updateStyle('border-style', $event)" />
          </FieldRowUi>
          <FieldRowUi label="Color">
            <ColorInputUi :model-value="activeStyles['border-color'] ?? ''" placeholder="#e5e7eb" @update:model-value="updateStyle('border-color', $event)" />
          </FieldRowUi>
        </div>
      </template>

      <template v-else>
        <div v-for="side in ['top', 'right', 'bottom', 'left']" :key="side" class="space-y-1">
          <span class="text-[10px] text-secondary capitalize">{{ side }}</span>
          <div class="grid grid-cols-3 gap-1">
            <UnitInputUi :model-value="activeStyles[`border-${side}-width`] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle(`border-${side}-width`, $event)" />
            <SelectUi :model-value="activeStyles[`border-${side}-style`] ?? ''" :options="borderStyleOptions" @update:model-value="updateStyle(`border-${side}-style`, $event)" />
            <ColorInputUi :model-value="activeStyles[`border-${side}-color`] ?? ''" placeholder="#e5e7eb" @update:model-value="updateStyle(`border-${side}-color`, $event)" />
          </div>
        </div>
      </template>

      <div class="space-y-1 pt-1">
        <span class="text-[10px] text-secondary">Radius</span>
        <LinkedUnitInputUi
          :model-value="getLinkedValues(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'])"
          :labels="['TL', 'TR', 'BR', 'BL']"
          :units="['px', '%', 'em', 'rem']"
          @update:model-value="updateLinkedStyles(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'], $event)"
        />
      </div>
    </div>
  </PropertySectionUi>
</template>
