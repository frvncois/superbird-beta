<script setup lang="ts">
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import SizeTokenInputUi from '@/components/ui/SizeTokenInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import FontFamilyControl from './FontFamilyControl.vue'
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

const { field, statesWithValues } = useNodeStyles()

const typographyKeys = ['font-family', 'font-size', 'line-height', 'font-weight', 'font-style', 'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing', 'white-space', 'color']
</script>

<template>
  <PropertySectionUi title="Typography" icon="typography" :states-with-values="statesWithValues(typographyKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Family">
        <FontFamilyControl v-bind="field('font-family')" />
      </FieldRowUi>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="space-y-1">
          <DragLabelUi class="text-[10px] text-secondary" v-bind="field('font-size')">Size</DragLabelUi>
          <SizeTokenInputUi v-bind="field('font-size')" placeholder="16" :units="['px', 'em', 'rem', '%', 'vw']" />
        </div>
        <div class="space-y-1">
          <DragLabelUi class="text-[10px] text-secondary" v-bind="field('line-height')">Line Height</DragLabelUi>
          <SizeTokenInputUi v-bind="field('line-height')" placeholder="1.5" :units="['px', 'em', 'rem', '%']" />
        </div>
      </div>
      <FieldRowUi label="Weight">
        <SelectUi v-bind="field('font-weight')" :options="fontWeightOptions" />
      </FieldRowUi>
      <FieldRowUi label="Style">
        <SelectUi v-bind="field('font-style')" :options="fontStyleOptions" />
      </FieldRowUi>
      <FieldRowUi label="Align">
        <SelectUi v-bind="field('text-align')" :options="textAlignOptions" />
      </FieldRowUi>
      <FieldRowUi label="Decor">
        <SelectUi v-bind="field('text-decoration')" :options="textDecorationOptions" />
      </FieldRowUi>
      <FieldRowUi label="Transform">
        <SelectUi v-bind="field('text-transform')" :options="textTransformOptions" />
      </FieldRowUi>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="space-y-1">
          <span class="text-[10px] text-secondary">Spacing</span>
          <SizeTokenInputUi v-bind="field('letter-spacing')" placeholder="0" :units="['px', 'em', 'rem']" />
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-secondary">Word Spacing</span>
          <SizeTokenInputUi v-bind="field('word-spacing')" placeholder="0" :units="['px', 'em', 'rem']" />
        </div>
      </div>
      <FieldRowUi label="Wrap">
        <SelectUi v-bind="field('white-space')" :options="whiteSpaceOptions" />
      </FieldRowUi>
      <FieldRowUi label="Color">
        <ColorInputUi v-bind="field('color')" placeholder="#000" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
