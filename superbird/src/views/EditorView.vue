<script setup lang="ts">
import { computed, provide, ref, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import { startMcpBridge, stopMcpBridge } from '@/lib/ai/bridge'
import EditorLayout from '@/layouts/EditorLayout.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import EditorCanvas from '@/components/canvas/EditorCanvas.vue'
import CollapsibleSidebar from '@/components/sidebar/CollapsibleSidebar.vue'
import SidebarLayers from '@/components/sidebar/layers/SidebarLayers.vue'
import SidebarElements from '@/components/sidebar/elements/SidebarElements.vue'
import SidebarComponents from '@/components/sidebar/components/SidebarComponents.vue'
import SidebarProperties from '@/components/sidebar/properties/SidebarProperties.vue'
import SidebarSettings from '@/components/sidebar/settings/SidebarSettings.vue'
import SidebarInteractions from '@/components/sidebar/interactions/SidebarInteractions.vue'
import TabsUi from '@/components/ui/TabsUi.vue'
import PreviewOverlay from '@/components/preview/PreviewOverlay.vue'
import McpOverlay from '@/components/mcp/McpOverlay.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useSelectionSync } from '@/composables/useSelectionSync'

useKeyboardShortcuts()
// Scroll canvas + tree to the selected node; reset properties scroll to top.
useSelectionSync()

// While the editor is open, connect the live MCP bridge so an external MCP
// client (Claude Code, …) can drive the canvas.
onMounted(startMcpBridge)
onUnmounted(stopMcpBridge)

// Design tokens for UI primitives (ColorInputUi / SizeTokenInputUi swatches)
const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))

const canvasStore = useCanvasStore()
const contentMode = computed(() => canvasStore.editorMode === 'content')

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
  <EditorLayout :left-collapsed="leftCollapsed" :right-collapsed="rightCollapsed" :content-mode="contentMode">
    <template #header>
      <AppHeader mode="editor" />
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

  <PreviewOverlay v-if="canvasStore.previewOpen" />

  <!-- Locks the editor while the MCP assistant is actively editing. -->
  <McpOverlay />
</template>
