<script setup lang="ts">
import InputUi from '@/components/ui/InputUi.vue'
import SizeTokenInputUi from '@/components/ui/SizeTokenInputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
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

const { isFlex, isGrid, field, statesWithValues } = useNodeStyles()

const layoutKeys = ['display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap', 'grid-template-columns', 'grid-template-rows', 'overflow']
</script>

<template>
  <PropertySectionUi title="Layout" icon="layout" :states-with-values="statesWithValues(layoutKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Display">
        <DropdownUi class="w-full" v-bind="field('display')" :options="displayOptions" />
      </FieldRowUi>
      <template v-if="isFlex">
        <FieldRowUi label="Direction">
          <DropdownUi class="w-full" v-bind="field('flex-direction')" :options="flexDirectionOptions" />
        </FieldRowUi>
        <FieldRowUi label="Wrap">
          <DropdownUi class="w-full" v-bind="field('flex-wrap')" :options="flexWrapOptions" />
        </FieldRowUi>
        <FieldRowUi label="Align">
          <DropdownUi class="w-full" v-bind="field('align-items')" :options="alignOptions" />
        </FieldRowUi>
        <FieldRowUi label="Justify">
          <DropdownUi class="w-full" v-bind="field('justify-content')" :options="justifyOptions" />
        </FieldRowUi>
        <FieldRowUi label="Gap">
          <SizeTokenInputUi v-bind="field('gap')" placeholder="0" />
        </FieldRowUi>
      </template>
      <template v-if="isGrid">
        <FieldRowUi label="Columns">
          <InputUi v-bind="field('grid-template-columns')" placeholder="1fr 1fr" />
        </FieldRowUi>
        <FieldRowUi label="Rows">
          <InputUi v-bind="field('grid-template-rows')" placeholder="auto 1fr" />
        </FieldRowUi>
        <FieldRowUi label="Gap">
          <SizeTokenInputUi v-bind="field('gap')" placeholder="0" />
        </FieldRowUi>
      </template>
      <FieldRowUi label="Overflow">
        <DropdownUi class="w-full" v-bind="field('overflow')" :options="overflowOptions" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
