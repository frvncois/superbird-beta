<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldColUi from '@/components/ui/FieldColUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { positionOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, field, statesWithValues } = useNodeStyles()

const positionKeys = ['position', 'top', 'right', 'bottom', 'left', 'z-index']
</script>

<template>
  <PropertySectionUi title="Position" icon="position" :states-with-values="statesWithValues(positionKeys)" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Position">
        <DropdownUi class="w-full" v-bind="field('position')" :options="positionOptions" />
      </FieldRowUi>
      <template v-if="activeStyles.position && activeStyles.position !== 'static'">
        <div class="grid grid-cols-2 gap-1.5">
          <FieldColUi label="Top" drag v-bind="field('top')">
            <UnitInputUi v-bind="field('top')" placeholder="0" :allow-auto="true" />
          </FieldColUi>
          <FieldColUi label="Right" drag v-bind="field('right')">
            <UnitInputUi v-bind="field('right')" placeholder="0" :allow-auto="true" />
          </FieldColUi>
          <FieldColUi label="Bottom" drag v-bind="field('bottom')">
            <UnitInputUi v-bind="field('bottom')" placeholder="0" :allow-auto="true" />
          </FieldColUi>
          <FieldColUi label="Left" drag v-bind="field('left')">
            <UnitInputUi v-bind="field('left')" placeholder="0" :allow-auto="true" />
          </FieldColUi>
        </div>
        <FieldRowUi label="Z-Index">
          <InputUi v-bind="field('z-index')" placeholder="auto" />
        </FieldRowUi>
      </template>
    </div>
  </PropertySectionUi>
</template>
