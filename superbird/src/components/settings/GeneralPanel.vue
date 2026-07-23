<script setup lang="ts">
import { useSiteSettingsStore } from '@/stores/siteSettings'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'

const site = useSiteSettingsStore()
</script>

<template>
  <div class="space-y-10">
    <SettingsSection title="Site identity" description="Basic information about your project.">
      <SettingsRow label="Title">
        <InputUi
          :model-value="site.siteSettings.identity.title"
          @update:model-value="site.updateSiteIdentity({ title: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Tagline">
        <InputUi
          :model-value="site.siteSettings.identity.tagline"
          @update:model-value="site.updateSiteIdentity({ tagline: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Favicon" description="URL to a .ico or .png">
        <InputUi
          :model-value="site.siteSettings.identity.favicon ?? ''"
          placeholder="https://…"
          @update:model-value="site.updateSiteIdentity({ favicon: $event || undefined })"
        />
      </SettingsRow>
      <SettingsRow label="Logo" description="URL to your logo image">
        <InputUi
          :model-value="site.siteSettings.identity.logo ?? ''"
          placeholder="https://…"
          @update:model-value="site.updateSiteIdentity({ logo: $event || undefined })"
        />
      </SettingsRow>
    </SettingsSection>
  </div>
</template>
