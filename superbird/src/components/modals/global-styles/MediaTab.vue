<script setup lang="ts">
import { computed } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
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
  <div class="space-y-4 p-4">
    <PropertySectionUi title="Image Compression" icon="image">
      <div class="space-y-1.5">
        <FieldRowUi label="Compress uploads">
          <ToggleUi v-model="enabled" />
        </FieldRowUi>

        <template v-if="compression.enabled">
          <FieldRowUi label="Max width">
            <InputUi
              type="number"
              :model-value="String(compression.maxWidth)"
              @update:model-value="setNum('maxWidth', $event, 1, 10000)"
            />
          </FieldRowUi>
          <FieldRowUi label="Max height">
            <InputUi
              type="number"
              :model-value="String(compression.maxHeight)"
              @update:model-value="setNum('maxHeight', $event, 1, 10000)"
            />
          </FieldRowUi>
          <FieldRowUi label="Quality">
            <InputUi
              type="number"
              :model-value="String(compression.quality)"
              @update:model-value="setNum('quality', $event, 1, 100)"
            />
          </FieldRowUi>
        </template>
      </div>

      <p class="mt-2 text-[11px] leading-relaxed text-secondary">
        Uploaded images are converted to WebP and resized to fit within the max dimensions
        (aspect ratio preserved, never enlarged). SVGs and GIFs are left untouched.
      </p>
    </PropertySectionUi>
  </div>
</template>
