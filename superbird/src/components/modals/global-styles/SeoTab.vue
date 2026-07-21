<script setup lang="ts">
import { useSiteSettingsStore } from '@/stores/siteSettings'
import InputUi from '@/components/ui/InputUi.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const siteStore = useSiteSettingsStore()
</script>

<template>
  <div class="space-y-4 p-4">
    <PropertySectionUi title="SEO Defaults" icon="settings">
      <div class="space-y-1.5">
        <div class="space-y-1">
          <LabelUi>Title Format</LabelUi>
          <InputUi
            :model-value="siteStore.siteSettings.seo.titleFormat"
            placeholder="%page_title% | %site_title%"
            @update:model-value="siteStore.updateSeo({ titleFormat: $event })"
          />
          <span class="text-[9px] text-secondary/50">Use %page_title% and %site_title% as variables</span>
        </div>
        <div class="space-y-1">
          <LabelUi>Meta Description</LabelUi>
          <TextareaUi
            :model-value="siteStore.siteSettings.seo.metaDescription"
            placeholder="Default site description for search engines"
            :rows="2"
            @update:model-value="siteStore.updateSeo({ metaDescription: $event })"
          />
        </div>
        <FieldRowUi label="Social Image">
          <InputUi
            :model-value="siteStore.siteSettings.seo.socialImage ?? ''"
            placeholder="URL for OG image"
            @update:model-value="siteStore.updateSeo({ socialImage: $event || undefined })"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Robots" icon="settings" :default-open="false">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs">No Index (hide from search)</span>
          <ToggleUi
            :model-value="siteStore.siteSettings.seo.robotsNoIndex"
            @update:model-value="siteStore.updateSeo({ robotsNoIndex: $event })"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs">No Follow</span>
          <ToggleUi
            :model-value="siteStore.siteSettings.seo.robotsNoFollow"
            @update:model-value="siteStore.updateSeo({ robotsNoFollow: $event })"
          />
        </div>
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Analytics" icon="settings" :default-open="false">
      <div class="space-y-1.5">
        <FieldRowUi label="GA ID" label-width="sm">
          <InputUi
            :model-value="siteStore.siteSettings.seo.googleAnalyticsId ?? ''"
            placeholder="G-XXXXXXXXXX"
            @update:model-value="siteStore.updateSeo({ googleAnalyticsId: $event || undefined })"
          />
        </FieldRowUi>
        <FieldRowUi label="GTM ID" label-width="sm">
          <InputUi
            :model-value="siteStore.siteSettings.seo.googleTagManagerId ?? ''"
            placeholder="GTM-XXXXXXX"
            @update:model-value="siteStore.updateSeo({ googleTagManagerId: $event || undefined })"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>
  </div>
</template>
