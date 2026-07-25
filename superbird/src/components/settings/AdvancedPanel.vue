<script setup lang="ts">
import { useSiteSettingsStore } from '@/stores/siteSettings'
import SettingsPanel from './SettingsPanel.vue'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'

const site = useSiteSettingsStore()
</script>

<template>
  <SettingsPanel title="Advanced">
    <SettingsSection title="Custom code" description="Injected into every published page.">
      <SettingsRow label="Head" description="Inside <head> — analytics, fonts, meta tags." stacked>
        <TextareaUi
          :model-value="site.siteSettings.customCode.headCode"
          placeholder="<!-- Analytics, fonts, meta tags -->"
          :rows="4"
          mono
          @update:model-value="site.updateCustomCode({ headCode: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Body start" description="Right after <body> opens." stacked>
        <TextareaUi
          :model-value="site.siteSettings.customCode.bodyStartCode"
          placeholder="<!-- GTM noscript, etc -->"
          :rows="3"
          mono
          @update:model-value="site.updateCustomCode({ bodyStartCode: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Body end" description="Before </body> closes." stacked>
        <TextareaUi
          :model-value="site.siteSettings.customCode.bodyEndCode"
          placeholder="<!-- Chat widgets, scripts -->"
          :rows="3"
          mono
          @update:model-value="site.updateCustomCode({ bodyEndCode: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Custom CSS" description="Global styles added to every page." stacked>
        <TextareaUi
          :model-value="site.siteSettings.customCode.customCss"
          placeholder="/* Custom styles */"
          :rows="6"
          mono
          @update:model-value="site.updateCustomCode({ customCss: $event })"
        />
      </SettingsRow>
    </SettingsSection>

    </SettingsPanel>
</template>
