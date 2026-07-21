<script setup lang="ts">
import { useSiteSettingsStore } from '@/stores/siteSettings'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const siteStore = useSiteSettingsStore()
</script>

<template>
  <div class="space-y-4 p-4">
    <PropertySectionUi title="Head Code" icon="settings">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Injected inside &lt;head&gt;</span>
        <TextareaUi
          :model-value="siteStore.siteSettings.customCode.headCode"
          placeholder="<!-- Analytics, fonts, meta tags -->"
          :rows="4"
          mono
          @update:model-value="siteStore.updateCustomCode({ headCode: $event })"
        />
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Body Start Code" icon="settings" :default-open="false">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Right after &lt;body&gt; open</span>
        <TextareaUi
          :model-value="siteStore.siteSettings.customCode.bodyStartCode"
          placeholder="<!-- GTM noscript, etc -->"
          :rows="3"
          mono
          @update:model-value="siteStore.updateCustomCode({ bodyStartCode: $event })"
        />
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Body End Code" icon="settings" :default-open="false">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Before &lt;/body&gt; close</span>
        <TextareaUi
          :model-value="siteStore.siteSettings.customCode.bodyEndCode"
          placeholder="<!-- Chat widgets, scripts -->"
          :rows="3"
          mono
          @update:model-value="siteStore.updateCustomCode({ bodyEndCode: $event })"
        />
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Custom CSS" icon="settings" :default-open="false">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Global CSS added to every page</span>
        <TextareaUi
          :model-value="siteStore.siteSettings.customCode.customCss"
          placeholder="/* Custom styles */"
          :rows="6"
          mono
          @update:model-value="siteStore.updateCustomCode({ customCss: $event })"
        />
      </div>
    </PropertySectionUi>
  </div>
</template>
