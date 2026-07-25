<script setup lang="ts">
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldColUi from '@/components/ui/FieldColUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { field, statesWithValues } = useNodeStyles()

const sizeKeys = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']
</script>

<template>
  <PropertySectionUi title="Size" icon="size" :states-with-values="statesWithValues(sizeKeys)">
    <div class="grid grid-cols-2 gap-1.5">
      <FieldColUi label="Width" drag v-bind="field('width')">
        <UnitInputUi v-bind="field('width')" placeholder="0" :allow-auto="true" />
      </FieldColUi>
      <FieldColUi label="Height" drag v-bind="field('height')">
        <UnitInputUi v-bind="field('height')" placeholder="0" :allow-auto="true" />
      </FieldColUi>
      <FieldColUi label="Min W" drag v-bind="field('min-width')">
        <UnitInputUi v-bind="field('min-width')" placeholder="0" />
      </FieldColUi>
      <FieldColUi label="Min H" drag v-bind="field('min-height')">
        <UnitInputUi v-bind="field('min-height')" placeholder="0" />
      </FieldColUi>
      <FieldColUi label="Max W" drag v-bind="field('max-width')">
        <UnitInputUi v-bind="field('max-width')" placeholder="0" />
      </FieldColUi>
      <FieldColUi label="Max H" drag v-bind="field('max-height')">
        <UnitInputUi v-bind="field('max-height')" placeholder="0" />
      </FieldColUi>
    </div>
  </PropertySectionUi>
</template>
