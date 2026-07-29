<script setup lang="ts">
import { computed } from 'vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import UploadUi from '@/components/ui/UploadUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import {
  backgroundSizeOptions,
  backgroundPositionOptions,
  backgroundRepeatOptions,
} from '@/constants/propertyOptions'
import { useMediaStore } from '@/stores/media'
import { useNodeStyles } from './useNodeStyles'

const { field, activeStyles, updateStyle, statesWithValues } = useNodeStyles()
const mediaStore = useMediaStore()

const backgroundKeys = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat']

const backgroundImageUrl = computed(() => {
  const raw = activeStyles.value['background-image'] ?? ''
  const match = raw.match(/url\((['"]?)(.*?)\1\)/)
  return match ? match[2]! : ''
})

function setBackgroundImage(url: string) {
  updateStyle('background-image', url ? `url(${url})` : '')
}

function pickBackgroundImage() {
  mediaStore.openPicker((item) => setBackgroundImage(item.url))
}
</script>

<template>
  <PropertySectionUi title="Background" icon="background" :states-with-values="statesWithValues(backgroundKeys)">
    <div class="space-y-1.5">
      <FieldRowUi label="Image">
        <UploadUi
          :model-value="backgroundImageUrl"
          @update:model-value="setBackgroundImage"
          @pick="pickBackgroundImage"
        />
      </FieldRowUi>
      <FieldRowUi label="Color">
        <ColorInputUi v-bind="field('background-color')" placeholder="#fff" />
      </FieldRowUi>
      <FieldRowUi label="Size">
        <DropdownUi class="w-full" v-bind="field('background-size')" :options="backgroundSizeOptions" />
      </FieldRowUi>
      <FieldRowUi label="Position">
        <DropdownUi class="w-full" v-bind="field('background-position')" :options="backgroundPositionOptions" />
      </FieldRowUi>
      <FieldRowUi label="Repeat">
        <DropdownUi class="w-full" v-bind="field('background-repeat')" :options="backgroundRepeatOptions" />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
