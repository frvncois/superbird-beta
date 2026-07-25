<script setup lang="ts">
import { ref } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import SettingsPanel from './SettingsPanel.vue'
import InputUi from '@/components/ui/InputUi.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

const site = useSiteSettingsStore()

const newRedirectFrom = ref('')
const newRedirectTo = ref('')
function addRedirect() {
  if (!newRedirectFrom.value.trim() || !newRedirectTo.value.trim()) return
  site.addRedirect(newRedirectFrom.value.trim(), newRedirectTo.value.trim())
  newRedirectFrom.value = ''
  newRedirectTo.value = ''
}
</script>

<template>
  <SettingsPanel title="SEO">
    <SettingsSection title="SEO defaults" description="Fallback metadata for pages that don't set their own.">
      <SettingsRow label="Title format" description="Use %page_title% and %site_title%.">
        <InputUi
          :model-value="site.siteSettings.seo.titleFormat"
          placeholder="%page_title% | %site_title%"
          @update:model-value="site.updateSeo({ titleFormat: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Meta description" stacked>
        <TextareaUi
          :model-value="site.siteSettings.seo.metaDescription"
          placeholder="Default site description for search engines"
          :rows="2"
          @update:model-value="site.updateSeo({ metaDescription: $event })"
        />
      </SettingsRow>
      <SettingsRow label="Social image" description="OG image URL for shares.">
        <InputUi
          :model-value="site.siteSettings.seo.socialImage ?? ''"
          placeholder="https://…"
          @update:model-value="site.updateSeo({ socialImage: $event || undefined })"
        />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Search visibility">
      <SettingsRow label="No index" description="Hide the site from search engines.">
        <ToggleUi
          :model-value="site.siteSettings.seo.robotsNoIndex"
          @update:model-value="site.updateSeo({ robotsNoIndex: $event })"
        />
      </SettingsRow>
      <SettingsRow label="No follow" description="Tell crawlers not to follow links.">
        <ToggleUi
          :model-value="site.siteSettings.seo.robotsNoFollow"
          @update:model-value="site.updateSeo({ robotsNoFollow: $event })"
        />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Analytics">
      <SettingsRow label="Google Analytics">
        <InputUi
          :model-value="site.siteSettings.seo.googleAnalyticsId ?? ''"
          placeholder="G-XXXXXXXXXX"
          @update:model-value="site.updateSeo({ googleAnalyticsId: $event || undefined })"
        />
      </SettingsRow>
      <SettingsRow label="Tag Manager">
        <InputUi
          :model-value="site.siteSettings.seo.googleTagManagerId ?? ''"
          placeholder="GTM-XXXXXXX"
          @update:model-value="site.updateSeo({ googleTagManagerId: $event || undefined })"
        />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Redirects" description="301/302 redirects for SEO migrations.">
      <div
        v-for="r in site.siteSettings.redirects"
        :key="r.id"
        class="flex items-center gap-2 px-4 py-2.5"
      >
        <span class="shrink-0 font-mono text-[10px] text-secondary">{{ r.type }}</span>
        <span class="min-w-0 flex-1 truncate font-mono text-xs">{{ r.from }}</span>
        <IconUi name="arrow-right" size="size-3" class="shrink-0 text-secondary/50" />
        <span class="min-w-0 flex-1 truncate font-mono text-xs">{{ r.to }}</span>
        <IconButtonUi size="sm" variant="danger" title="Remove redirect" @click="site.removeRedirect(r.id)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <EmptyStateUi v-if="site.siteSettings.redirects.length === 0" compact message="No redirects yet" class="px-4 py-3" />
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="newRedirectFrom" placeholder="/old-path" class="flex-1 font-mono" />
        <IconUi name="arrow-right" size="size-3" class="shrink-0 text-secondary/50" />
        <InputUi v-model="newRedirectTo" placeholder="/new-path" class="flex-1 font-mono" @keydown.enter="addRedirect" />
        <ButtonUi size="sm" @click="addRedirect">Add</ButtonUi>
      </div>
    </SettingsSection>
  </SettingsPanel>
</template>
