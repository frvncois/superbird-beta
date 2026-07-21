<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import SizeTokenInputUi from '@/components/ui/SizeTokenInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import {
  displayOptions,
  flexDirectionOptions,
  flexWrapOptions,
  alignOptions,
  justifyOptions,
  overflowOptions,
} from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, isFlex, isGrid, updateStyle, statesWithValues } = useNodeStyles()

const layoutKeys = ['display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap', 'grid-template-columns', 'grid-template-rows', 'overflow']
</script>

<template>
  <PropertySectionUi title="Layout" icon="layout" :states-with-values="statesWithValues(layoutKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Display">
        <SelectUi :model-value="activeStyles.display ?? ''" :options="displayOptions" @update:model-value="updateStyle('display', $event)" />
      </FieldRowUi>
      <template v-if="isFlex">
        <FieldRowUi label="Direction">
          <SelectUi :model-value="activeStyles['flex-direction'] ?? ''" :options="flexDirectionOptions" @update:model-value="updateStyle('flex-direction', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Wrap">
          <SelectUi :model-value="activeStyles['flex-wrap'] ?? ''" :options="flexWrapOptions" @update:model-value="updateStyle('flex-wrap', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Align">
          <SelectUi :model-value="activeStyles['align-items'] ?? ''" :options="alignOptions" @update:model-value="updateStyle('align-items', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Justify">
          <SelectUi :model-value="activeStyles['justify-content'] ?? ''" :options="justifyOptions" @update:model-value="updateStyle('justify-content', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Gap">
          <SizeTokenInputUi :model-value="activeStyles.gap ?? ''" placeholder="0" @update:model-value="updateStyle('gap', $event)" />
        </FieldRowUi>
      </template>
      <template v-if="isGrid">
        <FieldRowUi label="Columns">
          <InputUi :model-value="activeStyles['grid-template-columns'] ?? ''" placeholder="1fr 1fr" @update:model-value="updateStyle('grid-template-columns', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Rows">
          <InputUi :model-value="activeStyles['grid-template-rows'] ?? ''" placeholder="auto 1fr" @update:model-value="updateStyle('grid-template-rows', $event)" />
        </FieldRowUi>
        <FieldRowUi label="Gap">
          <SizeTokenInputUi :model-value="activeStyles.gap ?? ''" placeholder="0" @update:model-value="updateStyle('gap', $event)" />
        </FieldRowUi>
      </template>
      <FieldRowUi label="Overflow">
        <SelectUi :model-value="activeStyles.overflow ?? ''" :options="overflowOptions" @update:model-value="updateStyle('overflow', $event)" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
