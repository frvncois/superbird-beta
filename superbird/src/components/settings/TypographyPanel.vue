<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint } from '@/types/canvas'
import { fontSetStack } from '@/lib/fonts'
import { DEFAULT_FONTS } from '@/data/defaultFonts'
import { uploadFontFace, deleteFontFiles } from '@/lib/fontApi'
import SettingsSection from './SettingsSection.vue'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

const store = useGlobalStylesStore()

// ── Uploaded font families ──
const uploadName = ref('')
const uploadWeight = ref('400')
const uploadStyle = ref<'normal' | 'italic'>('normal')
const uploadInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'].map((w) => ({ value: w, label: w }))
const styleOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
]

async function onUploadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const name = uploadName.value.trim() || file.name.replace(/\.[^.]+$/, '')
  uploading.value = true
  uploadError.value = ''
  try {
    const face = await uploadFontFace(file, uploadWeight.value, uploadStyle.value)
    store.addFontFamily({
      id: `custom_${Date.now().toString(36)}`,
      name,
      source: 'custom',
      faces: [face],
    })
    uploadName.value = ''
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Upload failed.'
  } finally {
    uploading.value = false
    if (uploadInput.value) uploadInput.value.value = ''
  }
}

async function removeFamily(id: string) {
  const family = store.globalStyles.fontSet?.find((f) => f.id === id)
  store.removeFontFamily(id)
  // Reclaim the self-hosted files (best-effort; the family is already removed).
  const urls = family?.faces.map((f) => f.url).filter(Boolean) ?? []
  if (urls.length) {
    try {
      await deleteFontFiles(urls)
    } catch {
      /* files are orphaned at worst; not worth blocking the UI */
    }
  }
}

// ── Font variables (design tokens) ──
const fontVars = computed(() => Object.entries(store.globalStyles.fonts))

// Value options for a variable: uploaded fonts + the default fonts.
const fontValueOptions = computed(() => [
  ...(store.globalStyles.fontSet ?? []).map((f) => ({ value: fontSetStack(f), label: f.name })),
  ...DEFAULT_FONTS.map((b) => ({ value: b.value, label: b.name })),
])

const newVarName = ref('')
const newVarValue = ref('')
function addVar() {
  const name = newVarName.value.trim()
  if (!name || !newVarValue.value) return
  store.addGlobalFont(name, newVarValue.value)
  newVarName.value = ''
  newVarValue.value = ''
}

// ── Type scale ──
const typoBp = ref<Breakpoint>('desktop')
const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
const breakpointOptions = BREAKPOINTS.map((bp) => ({ value: bp.key, label: bp.label }))
const headingWeightOptions = ['400', '500', '600', '700', '800', '900'].map((w) => ({ value: w, label: w }))
</script>

<template>
  <div class="space-y-10">
    <!-- Uploaded fonts -->
    <SettingsSection title="Fonts" description="Upload your own font files (.woff2, .woff, .ttf, .otf). They're self-hosted on your site.">
      <div v-if="store.globalStyles.fontSet?.length" class="divide-y">
        <div v-for="family in store.globalStyles.fontSet" :key="family.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="min-w-0 truncate text-base text-foreground" :style="{ fontFamily: fontSetStack(family) }">{{ family.name }}</span>
          <span class="shrink-0 text-[10px] font-mono text-secondary">{{ family.faces.length }} {{ family.faces.length === 1 ? 'weight' : 'weights' }}</span>
          <div class="flex-1" />
          <IconButtonUi size="sm" variant="danger" title="Remove font" @click="removeFamily(family.id)">
            <IconUi name="close" size="size-3" />
          </IconButtonUi>
        </div>
      </div>
      <p v-else class="px-4 py-2.5 text-xs text-secondary">No fonts uploaded yet.</p>

      <div class="space-y-2 bg-secondary/5 px-4 py-3">
        <div class="flex flex-wrap items-center gap-2">
          <InputUi v-model="uploadName" placeholder="Font name (optional)" class="w-44 shrink-0" />
          <SelectUi v-model="uploadWeight" :options="weightOptions" class="w-20 shrink-0" />
          <SelectUi v-model="uploadStyle" :options="styleOptions" class="w-24 shrink-0" />
          <input ref="uploadInput" type="file" accept=".woff2,.woff,.ttf,.otf" class="hidden" @change="onUploadFile" />
          <ButtonUi size="sm" :disabled="uploading" @click="uploadInput?.click()">
            {{ uploading ? 'Uploading…' : 'Upload font file' }}
          </ButtonUi>
        </div>
        <p class="text-[11px] text-secondary">Upload one file per weight/style. Re-upload with the same name to add more weights.</p>
        <p v-if="uploadError" class="text-xs text-red-fg">{{ uploadError }}</p>
      </div>
    </SettingsSection>

    <!-- Font variables -->
    <SettingsSection title="Font variables" description="Named fonts you reuse across the design (e.g. body, heading).">
      <div v-for="[name, value] in fontVars" :key="name" class="flex items-center gap-2 px-4 py-2.5">
        <span class="w-24 shrink-0 font-mono text-xs text-foreground">{{ name }}</span>
        <SelectUi
          class="flex-1"
          :model-value="value"
          :options="fontValueOptions"
          placeholder="Pick a font"
          @update:model-value="store.setGlobalFont(name, $event)"
        />
        <IconButtonUi
          size="sm"
          variant="danger"
          title="Remove variable"
          :disabled="name === 'primary'"
          @click="store.removeGlobalFont(name)"
        >
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="newVarName" placeholder="Name (e.g. heading)" class="w-40 shrink-0" />
        <SelectUi v-model="newVarValue" :options="fontValueOptions" placeholder="Pick a font" class="flex-1" />
        <ButtonUi size="sm" @click="addVar">Add</ButtonUi>
      </div>
    </SettingsSection>

    <!-- Type scale -->
    <SettingsSection title="Type scale" description="Base text and heading scale, per breakpoint.">
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
              :options="headingWeightOptions"
              @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontWeight: $event })"
            />
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>
