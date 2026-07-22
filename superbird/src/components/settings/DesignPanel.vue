<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint } from '@/types/canvas'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

const store = useGlobalStylesStore()
const site = useSiteSettingsStore()

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

// Custom fonts
const newFontName = ref('')
const newFontUrl = ref('')
function addFont() {
  if (!newFontName.value.trim() || !newFontUrl.value.trim()) return
  site.addCustomFont(newFontName.value.trim(), newFontUrl.value.trim())
  newFontName.value = ''
  newFontUrl.value = ''
}

// Typography
const typoBp = ref<Breakpoint>('desktop')
const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
const breakpointOptions = BREAKPOINTS.map((bp) => ({ value: bp.key, label: bp.label }))
const weightOptions = ['400', '500', '600', '700', '800', '900'].map((w) => ({ value: w, label: w }))
</script>

<template>
  <div class="space-y-10">
    <!-- Colors -->
    <SettingsSection title="Color palette" description="Reusable colors available across the editor.">
      <div
        v-for="(value, name) in store.globalStyles.colors"
        :key="name"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <span class="w-28 shrink-0 truncate font-mono text-xs text-foreground">{{ name }}</span>
        <ColorInputUi
          class="min-w-0 flex-1"
          :model-value="value"
          @update:model-value="store.setGlobalColor(name as string, $event)"
        />
        <IconButtonUi size="sm" variant="danger" title="Remove color" @click="store.removeGlobalColor(name as string)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <ColorInputUi v-model="newColorValue" class="w-28 shrink-0" />
        <InputUi v-model="newColorName" placeholder="Color name" class="flex-1" @keydown.enter="addColor" />
        <ButtonUi size="sm" @click="addColor">Add</ButtonUi>
      </div>
    </SettingsSection>

    <!-- Fonts -->
    <SettingsSection title="Fonts" description="Font families and any custom web fonts.">
      <SettingsRow label="Primary">
        <InputUi
          :model-value="store.globalStyles.fonts.primary ?? ''"
          placeholder="Inter"
          @update:model-value="store.setGlobalFont('primary', $event)"
        />
      </SettingsRow>
      <SettingsRow label="Secondary">
        <InputUi
          :model-value="store.globalStyles.fonts.secondary ?? ''"
          placeholder="Playfair Display"
          @update:model-value="store.setGlobalFont('secondary', $event)"
        />
      </SettingsRow>
      <SettingsRow label="Google Fonts API key" description="Optional — enables the font picker.">
        <InputUi
          :model-value="site.siteSettings.integrations.googleFontsApiKey ?? ''"
          placeholder="Optional"
          @update:model-value="site.updateIntegrations({ googleFontsApiKey: $event || undefined })"
        />
      </SettingsRow>

      <div
        v-for="(font, i) in site.siteSettings.integrations.customFonts"
        :key="i"
        class="flex items-center gap-2 px-4 py-2.5"
      >
        <span class="text-sm font-medium text-foreground">{{ font.name }}</span>
        <span class="min-w-0 flex-1 truncate text-xs text-secondary">{{ font.url }}</span>
        <IconButtonUi size="sm" variant="danger" title="Remove font" @click="site.removeCustomFont(i)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="newFontName" placeholder="Font name" class="w-40 shrink-0" />
        <InputUi v-model="newFontUrl" placeholder="WOFF2 URL" class="flex-1" @keydown.enter="addFont" />
        <ButtonUi size="sm" @click="addFont">Add</ButtonUi>
      </div>
    </SettingsSection>

    <!-- Sizes -->
    <SettingsSection title="Size scale" description="Named spacing/size tokens.">
      <div
        v-for="(value, name) in store.globalStyles.sizes"
        :key="name"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <span class="w-16 shrink-0 font-mono text-xs text-secondary">{{ name }}</span>
        <InputUi
          class="min-w-0 flex-1"
          :model-value="value"
          placeholder="16px"
          @update:model-value="store.setGlobalSize(name as string, $event)"
        />
        <IconButtonUi size="sm" variant="danger" title="Remove size" @click="store.removeGlobalSize(name as string)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="newSizeName" placeholder="name" class="w-24 shrink-0" />
        <InputUi v-model="newSizeValue" placeholder="16px" class="flex-1" @keydown.enter="addSize" />
        <ButtonUi size="sm" @click="addSize">Add</ButtonUi>
      </div>
    </SettingsSection>

    <!-- Typography -->
    <SettingsSection title="Typography" description="Base text and heading scale, per breakpoint.">
      <div class="space-y-4 px-4 py-3.5">
        <SegmentedControlUi
          :model-value="typoBp"
          :options="breakpointOptions"
          grow
          @update:model-value="typoBp = $event as Breakpoint"
        />

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <LabelUi>Base size</LabelUi>
            <UnitInputUi
              :model-value="store.globalStyles.typography[typoBp].baseFontSize"
              :units="['px', 'rem']"
              @update:model-value="store.updateTypography(typoBp, 'baseFontSize', $event)"
            />
          </div>
          <div class="space-y-1">
            <LabelUi>Line height</LabelUi>
            <InputUi
              :model-value="store.globalStyles.typography[typoBp].baseLineHeight"
              placeholder="1.5"
              @update:model-value="store.updateTypography(typoBp, 'baseLineHeight', $event)"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <LabelUi>Headings</LabelUi>
          <div v-for="tag in headingTags" :key="tag" class="flex items-center gap-2">
            <span class="w-8 shrink-0 font-mono text-xs uppercase text-secondary">{{ tag }}</span>
            <UnitInputUi
              class="flex-1"
              :model-value="store.globalStyles.typography[typoBp].headings[tag].fontSize"
              :units="['px', 'rem', 'em']"
              placeholder="48"
              @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontSize: $event })"
            />
            <SelectUi
              class="w-24"
              :model-value="store.globalStyles.typography[typoBp].headings[tag].fontWeight"
              :options="weightOptions"
              @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontWeight: $event })"
            />
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>
