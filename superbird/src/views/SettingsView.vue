<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import AppHeader from '@/components/header/AppHeader.vue'
import TabsUi from '@/components/ui/TabsUi.vue'
import GeneralTab from '@/components/modals/global-styles/GeneralTab.vue'
import SiteTab from '@/components/modals/global-styles/SiteTab.vue'
import StylesTab from '@/components/modals/global-styles/StylesTab.vue'
import SeoTab from '@/components/modals/global-styles/SeoTab.vue'
import CodeTab from '@/components/modals/global-styles/CodeTab.vue'
import RedirectsTab from '@/components/modals/global-styles/RedirectsTab.vue'
import IntegrationsTab from '@/components/modals/global-styles/IntegrationsTab.vue'

// Design tokens for UI primitives (ColorInputUi / SizeTokenInputUi swatches).
const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))

const activeTab = ref('general')
const tabs = [
  { key: 'general', label: 'General' },
  { key: 'site', label: 'Site' },
  { key: 'styles', label: 'Styles' },
  { key: 'seo', label: 'SEO' },
  { key: 'code', label: 'Code' },
  { key: 'redirects', label: 'Redirects' },
  { key: 'integrations', label: 'Integrations' },
]
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <AppHeader mode="settings" />
    </header>

    <main class="min-h-0 flex-1 overflow-hidden">
      <div class="mx-auto flex h-full max-w-3xl flex-col px-6">
        <TabsUi v-model="activeTab" :tabs="tabs" class="settings-tabs h-full">
          <template #general><GeneralTab /></template>
          <template #site><SiteTab /></template>
          <template #styles><StylesTab /></template>
          <template #seo><SeoTab /></template>
          <template #code><CodeTab /></template>
          <template #redirects><RedirectsTab /></template>
          <template #integrations><IntegrationsTab /></template>
        </TabsUi>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Pin the tab bar; scroll the tab content. */
.settings-tabs {
  display: flex;
  flex-direction: column;
}
.settings-tabs > :deep(div:first-child) {
  flex-shrink: 0;
}
.settings-tabs > :deep(div:last-child) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
