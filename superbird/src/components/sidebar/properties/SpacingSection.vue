<script setup lang="ts">
import LinkedFieldUi from '@/components/ui/LinkedFieldUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { linked, statesWithValues } = useNodeStyles()

const spacingKeys = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']
</script>

<template>
  <PropertySectionUi title="Spacing" icon="spacing" :states-with-values="statesWithValues(spacingKeys)">
    <div class="space-y-3">
      <LinkedFieldUi title="Padding" v-bind="linked(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])" />
      <LinkedFieldUi title="Margin" v-bind="linked(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])" allow-auto />
    </div>
  </PropertySectionUi>
</template>
