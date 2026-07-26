<script setup lang="ts">
import { ref } from 'vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import LinkedFieldUi from '@/components/ui/LinkedFieldUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { borderStyleOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { field, linked, statesWithValues } = useNodeStyles()

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
            <UnitInputUi v-bind="field('border-width')" placeholder="0" :units="['px', 'em', 'rem']" />
          </FieldRowUi>
          <FieldRowUi label="Style">
            <DropdownUi class="w-full" v-bind="field('border-style')" :options="borderStyleOptions" />
          </FieldRowUi>
          <FieldRowUi label="Color">
            <ColorInputUi v-bind="field('border-color')" placeholder="#e5e7eb" />
          </FieldRowUi>
        </div>
      </template>

      <template v-else>
        <div v-for="side in ['top', 'right', 'bottom', 'left']" :key="side" class="space-y-1">
          <LabelUi size="sm" class="text-secondary capitalize">{{ side }}</LabelUi>
          <div class="grid grid-cols-3 gap-1">
            <UnitInputUi v-bind="field(`border-${side}-width`)" placeholder="0" :units="['px', 'em', 'rem']" />
            <DropdownUi class="w-full" v-bind="field(`border-${side}-style`)" :options="borderStyleOptions" />
            <ColorInputUi v-bind="field(`border-${side}-color`)" compact />
          </div>
        </div>
      </template>

      <div class="pt-1">
        <LinkedFieldUi
          title="Radius"
          link-noun="corners"
          v-bind="linked(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'])"
          :labels="['TL', 'TR', 'BR', 'BL']"
          :units="['px', '%', 'em', 'rem']"
        />
      </div>
    </div>
  </PropertySectionUi>
</template>
