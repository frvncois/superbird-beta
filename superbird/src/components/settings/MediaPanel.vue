<script setup lang="ts">
import { computed } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'

const store = useSiteSettingsStore()
const compression = computed(() => store.siteSettings.imageCompression)

const enabled = computed({
  get: () => compression.value.enabled,
  set: (v: boolean) => store.updateImageCompression({ enabled: v }),
})

function setNum(key: 'maxWidth' | 'maxHeight' | 'quality', value: string, min: number, max: number) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return
  store.updateImageCompression({ [key]: Math.min(max, Math.max(min, n)) })
}
</script>

<template>
  <div class="space-y-10">
    <SettingsSection
      title="Image compression"
      description="Uploaded images are converted to WebP and resized to fit within the max dimensions (aspect ratio preserved, never enlarged). SVGs and GIFs are left untouched."
    >
      <SettingsRow label="Compress uploads" description="Recommended — smaller files, faster pages.">
        <ToggleUi v-model="enabled" />
      </SettingsRow>

      <template v-if="compression.enabled">
        <SettingsRow label="Max width">
          <InputUi
            type="number"
            :model-value="String(compression.maxWidth)"
            @update:model-value="setNum('maxWidth', $event, 1, 10000)"
          />
        </SettingsRow>
        <SettingsRow label="Max height">
          <InputUi
            type="number"
            :model-value="String(compression.maxHeight)"
            @update:model-value="setNum('maxHeight', $event, 1, 10000)"
          />
        </SettingsRow>
        <SettingsRow label="Quality" description="1–100. Higher keeps more detail.">
          <InputUi
            type="number"
            :model-value="String(compression.quality)"
            @update:model-value="setNum('quality', $event, 1, 100)"
          />
        </SettingsRow>
      </template>
    </SettingsSection>
  </div>
</template>
