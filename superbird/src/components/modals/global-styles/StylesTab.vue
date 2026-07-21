<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useGlobalStylesStore()

// Colors
const newColorName = ref('')
const newColorValue = ref('#000000')
function addColor() {
  const name = newColorName.value.trim()
  if (!name) return
  store.addGlobalColor(name, newColorValue.value)
  newColorName.value = ''
  newColorValue.value = '#000000'
}

// Sizes
const newSizeName = ref('')
const newSizeValue = ref('')
function addSize() {
  const name = newSizeName.value.trim()
  if (!name || !newSizeValue.value) return
  store.addGlobalSize(name, newSizeValue.value)
  newSizeName.value = ''
  newSizeValue.value = ''
}

// Typography breakpoint
const typoBp = ref<Breakpoint>('desktop')
const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
const breakpointOptions = BREAKPOINTS.map((bp) => ({ value: bp.key, label: bp.label }))
const weightOptions = [
  { value: '400', label: '400' },
  { value: '500', label: '500' },
  { value: '600', label: '600' },
  { value: '700', label: '700' },
  { value: '800', label: '800' },
  { value: '900', label: '900' },
]
</script>

<template>
  <div class="p-4">
    <!-- Colors -->
    <PropertySectionUi title="Color Palette" icon="background">
      <div class="space-y-2">
        <div class="space-y-1">
          <div
            v-for="(value, name) in store.globalStyles.colors"
            :key="name"
            class="flex items-center gap-2"
          >
            <span class="w-16 shrink-0 truncate text-xs font-mono">{{ name }}</span>
            <ColorInputUi
              class="min-w-0 flex-1"
              :model-value="value"
              @update:model-value="store.setGlobalColor(name as string, $event)"
            />
            <IconButtonUi size="sm" variant="danger" title="Remove color" @click="store.removeGlobalColor(name as string)">
              <IconUi name="close" size="size-3" />
            </IconButtonUi>
          </div>
        </div>
        <div class="flex items-center gap-1.5 pt-1">
          <ColorInputUi v-model="newColorValue" class="w-24 shrink-0" />
          <InputUi
            v-model="newColorName"
            size="xs"
            placeholder="Color name"
            class="flex-1"
            @keydown.enter="addColor"
          />
          <ButtonUi size="sm" @click="addColor">Add</ButtonUi>
        </div>
      </div>
    </PropertySectionUi>

    <!-- Fonts -->
    <PropertySectionUi title="Fonts" icon="typography">
      <div class="space-y-1.5">
        <FieldRowUi label="Primary">
          <InputUi
            :model-value="store.globalStyles.fonts.primary"
            placeholder="Inter"
            @update:model-value="store.setGlobalFont('primary', $event)"
          />
        </FieldRowUi>
        <FieldRowUi label="Secondary">
          <InputUi
            :model-value="store.globalStyles.fonts.secondary"
            placeholder="Playfair Display"
            @update:model-value="store.setGlobalFont('secondary', $event)"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>

    <!-- Sizes -->
    <PropertySectionUi title="Size Scale" icon="size">
      <div class="space-y-2">
        <div class="space-y-1">
          <div
            v-for="(value, name) in store.globalStyles.sizes"
            :key="name"
            class="flex items-center gap-2"
          >
            <span class="w-10 shrink-0 text-[10px] font-mono text-secondary">{{ name }}</span>
            <InputUi
              :model-value="value"
              placeholder="16px"
              @update:model-value="store.setGlobalSize(name as string, $event)"
            />
            <IconButtonUi size="sm" variant="danger" title="Remove size" @click="store.removeGlobalSize(name as string)">
              <IconUi name="close" size="size-3" />
            </IconButtonUi>
          </div>
        </div>
        <div class="flex items-center gap-1.5 pt-1">
          <div class="w-16 shrink-0">
            <InputUi v-model="newSizeName" size="xs" placeholder="name" />
          </div>
          <InputUi
            v-model="newSizeValue"
            size="xs"
            placeholder="16px"
            class="flex-1"
            @keydown.enter="addSize"
          />
          <ButtonUi size="sm" @click="addSize">Add</ButtonUi>
        </div>
      </div>
    </PropertySectionUi>

    <!-- Typography -->
    <PropertySectionUi title="Typography" icon="typography">
      <div class="space-y-3">
        <SegmentedControlUi
          :model-value="typoBp"
          :options="breakpointOptions"
          size="xs"
          grow
          @update:model-value="typoBp = $event as Breakpoint"
        />
        <div class="space-y-1.5">
          <LabelUi>Base</LabelUi>
          <div class="grid grid-cols-2 gap-1.5">
            <div class="space-y-0.5">
              <LabelUi size="xs">Font Size</LabelUi>
              <UnitInputUi
                :model-value="store.globalStyles.typography[typoBp].baseFontSize"
                :units="['px', 'rem']"
                @update:model-value="store.updateTypography(typoBp, 'baseFontSize', $event)"
              />
            </div>
            <div class="space-y-0.5">
              <LabelUi size="xs">Line Height</LabelUi>
              <InputUi
                :model-value="store.globalStyles.typography[typoBp].baseLineHeight"
                placeholder="1.5"
                @update:model-value="store.updateTypography(typoBp, 'baseLineHeight', $event)"
              />
            </div>
          </div>
        </div>
        <div class="space-y-1.5">
          <LabelUi>Headings</LabelUi>
          <div v-for="tag in headingTags" :key="tag" class="flex items-center gap-1.5">
            <span class="w-6 shrink-0 text-[10px] font-mono text-secondary uppercase">{{ tag }}</span>
            <UnitInputUi
              :model-value="store.globalStyles.typography[typoBp].headings[tag].fontSize"
              :units="['px', 'rem', 'em']"
              placeholder="48"
              @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontSize: $event })"
            />
            <SelectUi
              :model-value="store.globalStyles.typography[typoBp].headings[tag].fontWeight"
              :options="weightOptions"
              @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontWeight: $event })"
            />
          </div>
        </div>
      </div>
    </PropertySectionUi>
  </div>
</template>
