<script setup lang="ts">
import { ref } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const siteStore = useSiteSettingsStore()

const newFontName = ref('')
const newFontUrl = ref('')
function addFont() {
  if (!newFontName.value.trim() || !newFontUrl.value.trim()) return
  siteStore.addCustomFont(newFontName.value.trim(), newFontUrl.value.trim())
  newFontName.value = ''
  newFontUrl.value = ''
}
</script>

<template>
  <div class="space-y-4 p-4">
    <PropertySectionUi title="Google Fonts" icon="typography">
      <div class="space-y-1.5">
        <FieldRowUi label="API Key">
          <InputUi
            :model-value="siteStore.siteSettings.integrations.googleFontsApiKey ?? ''"
            placeholder="Optional"
            @update:model-value="siteStore.updateIntegrations({ googleFontsApiKey: $event || undefined })"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Custom Fonts" icon="typography">
      <div class="space-y-2">
        <div v-if="siteStore.siteSettings.integrations.customFonts.length > 0" class="space-y-1">
          <div
            v-for="(font, i) in siteStore.siteSettings.integrations.customFonts"
            :key="i"
            class="flex items-center gap-2 rounded-lg bg-secondary/5 px-2.5 py-1.5"
          >
            <span class="text-xs font-medium flex-1">{{ font.name }}</span>
            <span class="text-[10px] text-secondary truncate max-w-24">{{ font.url }}</span>
            <IconButtonUi size="xs" variant="danger" title="Remove font" @click="siteStore.removeCustomFont(i)">
              <IconUi name="close" size="size-2.5" />
            </IconButtonUi>
          </div>
        </div>
        <div class="space-y-1">
          <InputUi v-model="newFontName" size="xs" placeholder="Font name" />
          <div class="flex items-center gap-1.5">
            <InputUi
              v-model="newFontUrl"
              size="xs"
              placeholder="WOFF2 URL"
              class="flex-1"
              @keydown.enter="addFont"
            />
            <ButtonUi size="sm" @click="addFont">Add</ButtonUi>
          </div>
        </div>
      </div>
    </PropertySectionUi>

    <PropertySectionUi title="Forms" icon="settings" :default-open="false">
      <div class="space-y-1.5">
        <FieldRowUi label="Handler">
          <InputUi
            :model-value="siteStore.siteSettings.integrations.formHandler ?? ''"
            placeholder="Webhook URL"
            @update:model-value="siteStore.updateIntegrations({ formHandler: $event || undefined })"
          />
        </FieldRowUi>
        <FieldRowUi label="Email">
          <InputUi
            :model-value="siteStore.siteSettings.integrations.formEmail ?? ''"
            placeholder="admin@site.com"
            @update:model-value="siteStore.updateIntegrations({ formEmail: $event || undefined })"
          />
        </FieldRowUi>
      </div>
    </PropertySectionUi>
  </div>
</template>
