<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import ModalUi from '@/components/ui/ModalUi.vue'
import TabsUi from '@/components/ui/TabsUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import SiteTab from './SiteTab.vue'
import StylesTab from './StylesTab.vue'
import SeoTab from './SeoTab.vue'
import CodeTab from './CodeTab.vue'
import RedirectsTab from './RedirectsTab.vue'
import IntegrationsTab from './IntegrationsTab.vue'

const store = useGlobalStylesStore()
const activeTab = ref('site')

const tabs = [
  { key: 'site', label: 'Site' },
  { key: 'styles', label: 'Styles' },
  { key: 'seo', label: 'SEO' },
  { key: 'code', label: 'Code' },
  { key: 'redirects', label: 'Redirects' },
  { key: 'integrations', label: 'Integrations' },
]

const panelOpen = computed({
  get: () => store.globalStylesPanelOpen,
  set: (open: boolean) => {
    if (open) store.openPanel()
    else store.closePanel()
  },
})
</script>

<template>
  <ModalUi v-model:open="panelOpen" position="right" panel-class="w-[420px] max-w-full">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-4 py-3 shrink-0">
      <h2 class="text-sm font-semibold">Global Settings</h2>
      <IconButtonUi title="Close" @click="store.closePanel()">
        <IconUi name="close" size="size-4" />
      </IconButtonUi>
    </div>

    <!-- Tabs -->
    <TabsUi v-model="activeTab" :tabs="tabs" class="gs-tabs min-h-0 flex-1">
      <template #site><SiteTab /></template>
      <template #styles><StylesTab /></template>
      <template #seo><SeoTab /></template>
      <template #code><CodeTab /></template>
      <template #redirects><RedirectsTab /></template>
      <template #integrations><IntegrationsTab /></template>
    </TabsUi>
  </ModalUi>
</template>

<style scoped>
/* Keep the tab bar pinned and let the tab content scroll inside the panel. */
.gs-tabs {
  display: flex;
  flex-direction: column;
}
.gs-tabs > :deep(div:first-child) {
  flex-shrink: 0;
  overflow-x: auto;
  padding-inline: 0.5rem;
}
.gs-tabs > :deep(div:last-child) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
