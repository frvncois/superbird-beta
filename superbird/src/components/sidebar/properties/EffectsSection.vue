<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { cursorOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, statesWithValues } = useNodeStyles()

const effectsKeys = ['opacity', 'box-shadow', 'cursor', 'transition', 'transform']
</script>

<template>
  <PropertySectionUi title="Effects" icon="effects" :states-with-values="statesWithValues(effectsKeys)" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Opacity">
        <InputUi :model-value="activeStyles.opacity ?? ''" placeholder="1" @update:model-value="updateStyle('opacity', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Shadow">
        <InputUi :model-value="activeStyles['box-shadow'] ?? ''" placeholder="0 1px 3px rgba(0,0,0,.1)" @update:model-value="updateStyle('box-shadow', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Cursor">
        <SelectUi :model-value="activeStyles.cursor ?? ''" :options="cursorOptions" @update:model-value="updateStyle('cursor', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Transition">
        <InputUi :model-value="activeStyles.transition ?? ''" placeholder="all 0.2s ease" @update:model-value="updateStyle('transition', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Transform">
        <InputUi :model-value="activeStyles.transform ?? ''" placeholder="none" @update:model-value="updateStyle('transform', $event)" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
