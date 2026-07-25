<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import { cursorOptions } from '@/constants/propertyOptions'
import { useNodeStyles } from './useNodeStyles'

const { field, statesWithValues } = useNodeStyles()

const effectsKeys = ['opacity', 'box-shadow', 'cursor', 'transition', 'transform']
</script>

<template>
  <PropertySectionUi title="Effects" icon="effects" :states-with-values="statesWithValues(effectsKeys)" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Opacity">
        <InputUi v-bind="field('opacity')" placeholder="1" />
      </FieldRowUi>
      <FieldRowUi label="Shadow">
        <InputUi v-bind="field('box-shadow')" placeholder="0 1px 3px rgba(0,0,0,.1)" />
      </FieldRowUi>
      <FieldRowUi label="Cursor">
        <SelectUi v-bind="field('cursor')" :options="cursorOptions" />
      </FieldRowUi>
      <FieldRowUi label="Transition">
        <InputUi v-bind="field('transition')" placeholder="all 0.2s ease" />
      </FieldRowUi>
      <FieldRowUi label="Transform">
        <InputUi v-bind="field('transform')" placeholder="none" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
