<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

const site = useSiteSettingsStore()

const theme = ref<'light' | 'dark'>('light')
onMounted(() => {
  theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
})
watch(theme, (v) => document.documentElement.classList.toggle('dark', v === 'dark'))
</script>

<template>
  <div class="space-y-10">
    <SettingsSection title="Appearance" description="How the editor looks. Doesn't affect your published site.">
      <SettingsRow label="Theme">
        <SegmentedControlUi
          v-model="theme"
          :options="[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]"
        />
      </SettingsRow>
    </SettingsSection>

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
