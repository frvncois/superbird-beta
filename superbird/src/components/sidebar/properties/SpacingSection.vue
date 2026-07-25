<script setup lang="ts">
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { linked, statesWithValues } = useNodeStyles()

const spacingKeys = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']
</script>

<template>
  <PropertySectionUi title="Spacing" icon="spacing" :states-with-values="statesWithValues(spacingKeys)">
    <div class="space-y-3">
      <div class="space-y-1">
        <LabelUi size="xs" class="block text-secondary">Padding</LabelUi>
        <LinkedUnitInputUi v-bind="linked(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])" />
      </div>
      <div class="space-y-1">
        <LabelUi size="xs" class="block text-secondary">Margin</LabelUi>
        <LinkedUnitInputUi v-bind="linked(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])" :allow-auto="true" />
      </div>
    </div>
  </PropertySectionUi>
</template>
