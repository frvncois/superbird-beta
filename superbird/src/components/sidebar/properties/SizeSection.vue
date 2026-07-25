<script setup lang="ts">
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import DragLabelUi from '@/components/ui/DragLabelUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { field, statesWithValues } = useNodeStyles()

const sizeKeys = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']
</script>

<template>
  <PropertySectionUi title="Size" icon="size" :states-with-values="statesWithValues(sizeKeys)">
    <div class="grid grid-cols-2 gap-1.5">
      <div class="space-y-1">
        <DragLabelUi v-bind="field('width')">Width</DragLabelUi>
        <UnitInputUi v-bind="field('width')" placeholder="0" :allow-auto="true" />
      </div>
      <div class="space-y-1">
        <DragLabelUi v-bind="field('height')">Height</DragLabelUi>
        <UnitInputUi v-bind="field('height')" placeholder="0" :allow-auto="true" />
      </div>
      <div class="space-y-1">
        <DragLabelUi v-bind="field('min-width')">Min W</DragLabelUi>
        <UnitInputUi v-bind="field('min-width')" placeholder="0" />
      </div>
      <div class="space-y-1">
        <DragLabelUi v-bind="field('min-height')">Min H</DragLabelUi>
        <UnitInputUi v-bind="field('min-height')" placeholder="0" />
      </div>
      <div class="space-y-1">
        <DragLabelUi v-bind="field('max-width')">Max W</DragLabelUi>
        <UnitInputUi v-bind="field('max-width')" placeholder="0" />
      </div>
      <div class="space-y-1">
        <DragLabelUi v-bind="field('max-height')">Max H</DragLabelUi>
        <UnitInputUi v-bind="field('max-height')" placeholder="0" />
      </div>
    </div>
  </PropertySectionUi>
</template>
