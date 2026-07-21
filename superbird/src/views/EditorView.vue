<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import EditorLayout from '@/layouts/EditorLayout.vue'
import EditorHeader from '@/components/editor/EditorHeader.vue'
import EditorCanvas from '@/components/editor/EditorCanvas.vue'
import CollapsibleSidebar from '@/components/editor/CollapsibleSidebar.vue'
import SidebarLayers from '@/components/editor/SidebarLayers.vue'
import SidebarElements from '@/components/editor/SidebarElements.vue'
import SidebarComponents from '@/components/editor/SidebarComponents.vue'
import SidebarProperties from '@/components/editor/SidebarProperties.vue'
import SidebarSettings from '@/components/editor/SidebarSettings.vue'
import SidebarInteractions from '@/components/editor/SidebarInteractions.vue'
import GlobalStylesPanel from '@/components/editor/GlobalStylesPanel.vue'
import MediaLibraryModal from '@/components/editor/MediaLibraryModal.vue'
import TabsUi from '@/components/ui/TabsUi.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

useKeyboardShortcuts()

// Design tokens for UI primitives (ColorInputUi / SizeTokenInputUi swatches)
const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))

const leftTab = ref('layers')
const rightTab = ref('properties')
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

const leftTabs = [
  { key: 'layers', label: 'Layers', icon: 'layers' },
  { key: 'elements', label: 'Elements', icon: 'elements' },
  { key: 'components', label: 'Components', icon: 'components' },
]

const rightTabs = [
  { key: 'properties', label: 'Properties', icon: 'properties' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'interactions', label: 'Interactions', icon: 'interactions' },
]
</script>

<template>
  <EditorLayout :left-collapsed="leftCollapsed" :right-collapsed="rightCollapsed">
    <template #header>
      <EditorHeader />
    </template>

    <template #sidebar-left>
      <CollapsibleSidebar
        v-model="leftTab"
        :tabs="leftTabs"
        :collapsed="leftCollapsed"
        side="left"
        @toggle="leftCollapsed = !leftCollapsed"
      >
        <TabsUi v-model="leftTab" :tabs="leftTabs">
          <template #layers><SidebarLayers /></template>
          <template #elements><SidebarElements /></template>
          <template #components><SidebarComponents /></template>
        </TabsUi>

        <template #layers><SidebarLayers /></template>
        <template #elements><SidebarElements /></template>
        <template #components><SidebarComponents /></template>
      </CollapsibleSidebar>
    </template>

    <template #canvas>
      <EditorCanvas />
    </template>

    <template #sidebar-right>
      <CollapsibleSidebar
        v-model="rightTab"
        :tabs="rightTabs"
        :collapsed="rightCollapsed"
        side="right"
        @toggle="rightCollapsed = !rightCollapsed"
      >
        <TabsUi v-model="rightTab" :tabs="rightTabs">
          <template #properties><SidebarProperties /></template>
          <template #settings><SidebarSettings /></template>
          <template #interactions><SidebarInteractions /></template>
        </TabsUi>

        <template #properties><SidebarProperties /></template>
        <template #settings><SidebarSettings /></template>
        <template #interactions><SidebarInteractions /></template>
      </CollapsibleSidebar>
    </template>
  </EditorLayout>

  <GlobalStylesPanel />
  <MediaLibraryModal />
</template>
