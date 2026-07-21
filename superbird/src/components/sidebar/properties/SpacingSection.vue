<script setup lang="ts">
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { getLinkedValues, updateLinkedStyles, statesWithValues } = useNodeStyles()

const spacingKeys = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']
</script>

<template>
  <PropertySectionUi title="Spacing" icon="spacing" :states-with-values="statesWithValues(spacingKeys)">
    <div class="space-y-3">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Padding</span>
        <LinkedUnitInputUi
          :model-value="getLinkedValues(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])"
          @update:model-value="updateLinkedStyles(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], $event)"
        />
      </div>
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Margin</span>
        <LinkedUnitInputUi
          :model-value="getLinkedValues(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])"
          :allow-auto="true"
          @update:model-value="updateLinkedStyles(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'], $event)"
        />
      </div>
    </div>
  </PropertySectionUi>
</template>
