<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import {
  backgroundSizeOptions,
  backgroundPositionOptions,
  backgroundRepeatOptions,
} from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, statesWithValues } = useNodeStyles()

const backgroundKeys = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat']
</script>

<template>
  <PropertySectionUi title="Background" icon="background" :states-with-values="statesWithValues(backgroundKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Color">
        <ColorInputUi :model-value="activeStyles['background-color'] ?? ''" placeholder="#fff" @update:model-value="updateStyle('background-color', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Image">
        <InputUi :model-value="activeStyles['background-image'] ?? ''" placeholder="url(...)" @update:model-value="updateStyle('background-image', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Size">
        <SelectUi :model-value="activeStyles['background-size'] ?? ''" :options="backgroundSizeOptions" @update:model-value="updateStyle('background-size', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Position">
        <SelectUi :model-value="activeStyles['background-position'] ?? ''" :options="backgroundPositionOptions" @update:model-value="updateStyle('background-position', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Repeat">
        <SelectUi :model-value="activeStyles['background-repeat'] ?? ''" :options="backgroundRepeatOptions" @update:model-value="updateStyle('background-repeat', $event)" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
