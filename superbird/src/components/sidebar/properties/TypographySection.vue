<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import SizeTokenInputUi from '@/components/ui/SizeTokenInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import DragLabelUi from '@/components/ui/DragLabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import {
  fontWeightOptions,
  fontStyleOptions,
  textAlignOptions,
  textDecorationOptions,
  textTransformOptions,
  whiteSpaceOptions,
} from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { activeStyles, updateStyle, statesWithValues } = useNodeStyles()

const typographyKeys = ['font-family', 'font-size', 'line-height', 'font-weight', 'font-style', 'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing', 'white-space', 'color']
</script>

<template>
  <PropertySectionUi title="Typography" icon="typography" :states-with-values="statesWithValues(typographyKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Family">
        <InputUi :model-value="activeStyles['font-family'] ?? ''" placeholder="inherit" @update:model-value="updateStyle('font-family', $event)" />
      </FieldRowUi>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="space-y-1">
          <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['font-size'] ?? ''" @update:model-value="updateStyle('font-size', $event)">Size</DragLabelUi>
          <SizeTokenInputUi :model-value="activeStyles['font-size'] ?? ''" placeholder="16" :units="['px', 'em', 'rem', '%', 'vw']" @update:model-value="updateStyle('font-size', $event)" />
        </div>
        <div class="space-y-1">
          <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['line-height'] ?? ''" @update:model-value="updateStyle('line-height', $event)">Line Height</DragLabelUi>
          <SizeTokenInputUi :model-value="activeStyles['line-height'] ?? ''" placeholder="1.5" :units="['px', 'em', 'rem', '%']" @update:model-value="updateStyle('line-height', $event)" />
        </div>
      </div>
      <FieldRowUi label="Weight">
        <SelectUi :model-value="activeStyles['font-weight'] ?? ''" :options="fontWeightOptions" @update:model-value="updateStyle('font-weight', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Style">
        <SelectUi :model-value="activeStyles['font-style'] ?? ''" :options="fontStyleOptions" @update:model-value="updateStyle('font-style', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Align">
        <SelectUi :model-value="activeStyles['text-align'] ?? ''" :options="textAlignOptions" @update:model-value="updateStyle('text-align', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Decor">
        <SelectUi :model-value="activeStyles['text-decoration'] ?? ''" :options="textDecorationOptions" @update:model-value="updateStyle('text-decoration', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Transform">
        <SelectUi :model-value="activeStyles['text-transform'] ?? ''" :options="textTransformOptions" @update:model-value="updateStyle('text-transform', $event)" />
      </FieldRowUi>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="space-y-1">
          <span class="text-[10px] text-secondary">Spacing</span>
          <SizeTokenInputUi :model-value="activeStyles['letter-spacing'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('letter-spacing', $event)" />
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-secondary">Word Spacing</span>
          <SizeTokenInputUi :model-value="activeStyles['word-spacing'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('word-spacing', $event)" />
        </div>
      </div>
      <FieldRowUi label="Wrap">
        <SelectUi :model-value="activeStyles['white-space'] ?? ''" :options="whiteSpaceOptions" @update:model-value="updateStyle('white-space', $event)" />
      </FieldRowUi>
      <FieldRowUi label="Color">
        <ColorInputUi :model-value="activeStyles.color ?? ''" placeholder="#000" @update:model-value="updateStyle('color', $event)" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
