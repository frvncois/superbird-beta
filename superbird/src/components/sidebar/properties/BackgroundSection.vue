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

const { field, statesWithValues } = useNodeStyles()

const backgroundKeys = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat']
</script>

<template>
  <PropertySectionUi title="Background" icon="background" :states-with-values="statesWithValues(backgroundKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Color">
        <ColorInputUi v-bind="field('background-color')" placeholder="#fff" />
      </FieldRowUi>
      <FieldRowUi label="Image">
        <InputUi v-bind="field('background-image')" placeholder="url(...)" />
      </FieldRowUi>
      <FieldRowUi label="Size">
        <SelectUi v-bind="field('background-size')" :options="backgroundSizeOptions" />
      </FieldRowUi>
      <FieldRowUi label="Position">
        <SelectUi v-bind="field('background-position')" :options="backgroundPositionOptions" />
      </FieldRowUi>
      <FieldRowUi label="Repeat">
        <SelectUi v-bind="field('background-repeat')" :options="backgroundRepeatOptions" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
