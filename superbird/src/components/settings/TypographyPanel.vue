<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint, FontFamily } from '@/types/canvas'
import type { FontCatalogEntry } from '@shared/types'
import { BASIC_FONTS, fontSetStack } from '@/lib/fonts'
import { searchFonts, importFont, uploadFontFace } from '@/lib/fontApi'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

const store = useGlobalStylesStore()
const site = useSiteSettingsStore()

// ── Font families (the self-hosted set) ──
const source = ref<'google' | 'fontshare'>('google')
const query = ref('')
const results = ref<FontCatalogEntry[]>([])
const searching = ref(false)
const searchError = ref('')
const importingFamily = ref<string | null>(null)

const sourceOptions = [
  { value: 'google', label: 'Google Fonts' },
  { value: 'fontshare', label: 'Fontshare' },
]

// Weights we import by default, intersected with what the family offers.
const DEFAULT_WEIGHTS = ['300', '400', '500', '600', '700']

async function runSearch() {
  searchError.value = ''
  searching.value = true
  try {
    const res = await searchFonts(source.value, query.value)
    results.value = res.items
  } catch (e) {
    results.value = []
    searchError.value =
      e instanceof Error && e.message === 'NO_GOOGLE_KEY'
        ? 'Add a Google Fonts API key below to search Google.'
        : e instanceof Error
          ? e.message
          : 'Search failed.'
  } finally {
    searching.value = false
  }
}

function alreadyAdded(family: string): boolean {
  return store.globalStyles.fontSet?.some((f) => f.name === family) ?? false
}

async function addFont(entry: FontCatalogEntry) {
  importingFamily.value = entry.family
  try {
    const weights = DEFAULT_WEIGHTS.filter((w) => entry.weights.includes(w))
    const family = await importFont({
      source: entry.source,
      family: entry.family,
      weights: weights.length ? weights : entry.weights.slice(0, 2),
    })
    store.addFontFamily(family as FontFamily)
  } catch (e) {
    searchError.value = e instanceof Error ? e.message : 'Import failed.'
  } finally {
    importingFamily.value = null
  }
}

// Custom upload
const uploadName = ref('')
const uploadWeight = ref('400')
const uploadStyle = ref<'normal' | 'italic'>('normal')
const uploadInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
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
    searchError.value = err instanceof Error ? err.message : 'Upload failed.'
  } finally {
    uploading.value = false
    if (uploadInput.value) uploadInput.value.value = ''
  }
}

function removeFamily(id: string) {
  store.removeFontFamily(id)
}

// ── Font variables (design tokens) ──
const fontVars = computed(() => Object.entries(store.globalStyles.fonts))

// Value options for a variable: font-set fonts + the basic stacks.
const fontValueOptions = computed(() => [
  ...(store.globalStyles.fontSet ?? []).map((f) => ({ value: fontSetStack(f), label: f.name })),
  ...BASIC_FONTS.map((b) => ({ value: b.stack, label: b.label })),
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
    <!-- Font families -->
    <SettingsSection title="Font families" description="Fonts available in your project. Google & Fontshare fonts are downloaded and self-hosted.">
      <SettingsRow label="Google Fonts API key" description="Required to search Google Fonts.">
        <InputUi
          :model-value="site.siteSettings.integrations.googleFontsApiKey ?? ''"
          placeholder="Optional"
          @update:model-value="site.updateIntegrations({ googleFontsApiKey: $event || undefined })"
        />
      </SettingsRow>

      <!-- Current set -->
      <div v-if="store.globalStyles.fontSet?.length" class="divide-y">
        <div v-for="family in store.globalStyles.fontSet" :key="family.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="text-base text-foreground truncate" :style="{ fontFamily: fontSetStack(family) }">{{ family.name }}</span>
          <span class="rounded bg-secondary/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-secondary">{{ family.source }}</span>
          <span class="text-[10px] font-mono text-secondary">{{ family.faces.length }} {{ family.faces.length === 1 ? 'weight' : 'weights' }}</span>
          <div class="flex-1" />
          <IconButtonUi size="sm" variant="danger" title="Remove font" @click="removeFamily(family.id)">
            <IconUi name="close" size="size-3" />
          </IconButtonUi>
        </div>
      </div>
      <p v-else class="px-4 py-2.5 text-xs text-secondary">No fonts added yet. Search below or upload your own.</p>

      <!-- Add from catalog -->
      <div class="space-y-2 bg-secondary/5 px-4 py-3">
        <div class="flex items-center gap-2">
          <SegmentedControlUi
            :model-value="source"
            :options="sourceOptions"
            @update:model-value="source = $event as 'google' | 'fontshare'; results = []"
          />
          <InputUi v-model="query" placeholder="Search fonts…" class="flex-1" @keydown.enter="runSearch" />
          <ButtonUi size="sm" :disabled="searching" @click="runSearch">{{ searching ? 'Searching…' : 'Search' }}</ButtonUi>
        </div>
        <p v-if="searchError" class="text-xs text-red-fg">{{ searchError }}</p>
        <div v-if="results.length" class="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border p-1">
          <div v-for="entry in results" :key="entry.family" class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/10">
            <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{ entry.family }}</span>
            <span class="shrink-0 text-[10px] font-mono text-secondary">{{ entry.weights.length }}w</span>
            <ButtonUi
              size="sm"
              variant="outline"
              :disabled="alreadyAdded(entry.family) || importingFamily === entry.family"
              @click="addFont(entry)"
            >
              {{ alreadyAdded(entry.family) ? 'Added' : importingFamily === entry.family ? 'Adding…' : 'Add' }}
            </ButtonUi>
          </div>
        </div>
      </div>

      <!-- Custom upload -->
      <div class="flex flex-wrap items-center gap-2 px-4 py-3">
        <InputUi v-model="uploadName" placeholder="Font name" class="w-40 shrink-0" />
        <SelectUi v-model="uploadWeight" :options="weightOptions" class="w-20 shrink-0" />
        <SelectUi v-model="uploadStyle" :options="styleOptions" class="w-24 shrink-0" />
        <input ref="uploadInput" type="file" accept=".woff2,.woff,.ttf,.otf" class="hidden" @change="onUploadFile" />
        <ButtonUi size="sm" :disabled="uploading" @click="uploadInput?.click()">
          {{ uploading ? 'Uploading…' : 'Upload font file' }}
        </ButtonUi>
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
