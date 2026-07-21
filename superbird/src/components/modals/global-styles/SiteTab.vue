<script setup lang="ts">
import { useSiteSettingsStore } from '@/stores/siteSettings'
import InputUi from '@/components/ui/InputUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const siteStore = useSiteSettingsStore()
</script>

<template>
  <div class="space-y-4 p-4">
    <PropertySectionUi title="Site Identity" icon="settings">
      <div class="space-y-1.5">
        <FieldRowUi label="Title">
          <InputUi
            :model-value="siteStore.siteSettings.identity.title"
            @update:model-value="siteStore.updateSiteIdentity({ title: $event })"
          />
        </FieldRowUi>
        <FieldRowUi label="Tagline">
          <InputUi
            :model-value="siteStore.siteSettings.identity.tagline"
            @update:model-value="siteStore.updateSiteIdentity({ tagline: $event })"
          />
        </FieldRowUi>
        <FieldRowUi label="Favicon">
          <InputUi
            :model-value="siteStore.siteSettings.identity.favicon ?? ''"
            placeholder="URL or upload"
            @update:model-value="siteStore.updateSiteIdentity({ favicon: $event || undefined })"
          />
        </FieldRowUi>
        <FieldRowUi label="Logo">
          <InputUi
            :model-value="siteStore.siteSettings.identity.logo ?? ''"
            placeholder="URL or upload"
            @update:model-value="siteStore.updateSiteIdentity({ logo: $event || undefined })"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>
  </div>
</template>
