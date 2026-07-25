<script setup lang="ts">
import { ref } from 'vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { borderStyleOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { field, linked, statesWithValues } = useNodeStyles()

const radiusLink = ref<{ linked: boolean; toggleLinked: () => void } | null>(null)

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
          <span class="text-[10px] text-secondary capitalize">{{ side }}</span>
          <div class="grid grid-cols-3 gap-1">
            <UnitInputUi v-bind="field(`border-${side}-width`)" placeholder="0" :units="['px', 'em', 'rem']" />
            <DropdownUi class="w-full" v-bind="field(`border-${side}-style`)" :options="borderStyleOptions" />
            <ColorInputUi v-bind="field(`border-${side}-color`)" placeholder="#e5e7eb" />
          </div>
        </div>
      </template>

      <div class="space-y-1 pt-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-secondary">Radius</span>
          <ButtonUi
            variant="bare"
            size="sm"
            icon="link"
            :active="radiusLink?.linked"
            :title="radiusLink?.linked ? 'Unlink corners' : 'Link corners'"
            @click="radiusLink?.toggleLinked()"
          />
        </div>
        <LinkedUnitInputUi
          ref="radiusLink"
          v-bind="linked(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'])"
          :labels="['TL', 'TR', 'BR', 'BL']"
          :units="['px', '%', 'em', 'rem']"
        />
      </div>
    </div>
  </PropertySectionUi>
</template>
