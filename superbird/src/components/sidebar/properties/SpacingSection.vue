<script setup lang="ts">
import { ref } from 'vue'
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import { useNodeStyles } from './useNodeStyles'

const { linked, statesWithValues } = useNodeStyles()

type LinkedInput = { linked: boolean; toggleLinked: () => void } | null
const paddingLink = ref<LinkedInput>(null)
const marginLink = ref<LinkedInput>(null)

const spacingKeys = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']
</script>

<template>
  <PropertySectionUi title="Spacing" icon="spacing" :states-with-values="statesWithValues(spacingKeys)">
    <div class="space-y-3">
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <LabelUi size="xs" class="text-secondary">Padding</LabelUi>
          <ButtonUi
            variant="bare"
            size="sm"
            icon="link"
            :active="paddingLink?.linked"
            :title="paddingLink?.linked ? 'Unlink sides' : 'Link sides'"
            @click="paddingLink?.toggleLinked()"
          />
        </div>
        <LinkedUnitInputUi ref="paddingLink" v-bind="linked(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])" />
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <LabelUi size="xs" class="text-secondary">Margin</LabelUi>
          <ButtonUi
            variant="bare"
            size="sm"
            icon="link"
            :active="marginLink?.linked"
            :title="marginLink?.linked ? 'Unlink sides' : 'Link sides'"
            @click="marginLink?.toggleLinked()"
          />
        </div>
        <LinkedUnitInputUi ref="marginLink" v-bind="linked(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])" :allow-auto="true" />
      </div>
    </div>
  </PropertySectionUi>
</template>
