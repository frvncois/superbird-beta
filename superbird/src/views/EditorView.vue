<script setup lang="ts">
import { computed, provide, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useUserComponentsStore } from '@/stores/userComponents'
import { useSnapshotsStore } from '@/stores/snapshots'
import { useToast } from '@/composables/useToast'
import { CreateComponentPromptKey } from '@/constants/injectionKeys'
import { startMcpBridge, stopMcpBridge } from '@/lib/ai/bridge'
import AppShell from '@/layouts/AppShell.vue'
import EditorLayout from '@/layouts/EditorLayout.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
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
import SnapshotPreviewOverlay from '@/components/preview/SnapshotPreviewOverlay.vue'
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

const canvasStore = useCanvasStore()
const snapshots = useSnapshotsStore()
const contentMode = computed(() => canvasStore.editorMode === 'content')

// Snapshot on editor open (deduped server-side — no row when nothing changed).
onMounted(() => {
  void snapshots.create({ reason: 'open' }).catch(() => {})
})

// "Restore this version" from the snapshot preview overlay.
async function restoreFromPreview() {
  const id = snapshots.previewMeta?.id
  if (!id) return
  await snapshots.restore(id)
  snapshots.closePreview()
  toast.success('Snapshot restored')
}

// Create-component name prompt — hosted once here so canvas + layers context
// menus share a single declarative dialog (see CreateComponentPromptKey).
const componentsStore = useUserComponentsStore()
const toast = useToast()
const createComponentNodeId = ref<string | null>(null)
const componentName = ref('')
const componentNameInput = ref<HTMLElement | null>(null)

watch(createComponentNodeId, async (id) => {
  if (!id) return
  componentName.value = ''
  await nextTick()
  componentNameInput.value?.querySelector('input')?.focus()
})

provide(CreateComponentPromptKey, (nodeId: string) => {
  createComponentNodeId.value = nodeId
})

function doCreateComponent() {
  const nodeId = createComponentNodeId.value
  const name = componentName.value.trim()
  if (nodeId && name) {
    componentsStore.createComponentFromNode(nodeId, name)
    toast.success(`Component “${name}” created`)
  }
  createComponentNodeId.value = null
}

const leftTab = ref('layers')
const rightTab = ref('properties')
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

const leftTabs = [
  { key: 'layers', label: 'Layers', icon: 'layers' },
  { key: 'elements', label: 'Elements', icon: 'elements' },
  { key: 'components', label: 'Block', icon: 'components' },
]

const rightTabs = [
  { key: 'properties', label: 'Style', icon: 'properties' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'interactions', label: 'Interactions', icon: 'interactions' },
]
</script>

<template>
  <AppShell>
    <EditorLayout :left-collapsed="leftCollapsed" :right-collapsed="rightCollapsed" :content-mode="contentMode">
      <template #sidebar-left>
      <CollapsibleSidebar
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
  </AppShell>

  <PreviewOverlay v-if="canvasStore.previewOpen" />

  <!-- Read-only preview of a past snapshot's document. -->
  <SnapshotPreviewOverlay
    v-if="snapshots.previewDoc"
    :document="snapshots.previewDoc"
    :meta="snapshots.previewMeta"
    @close="snapshots.closePreview()"
    @restore="restoreFromPreview"
  />

  <!-- Locks the editor while the MCP assistant is actively editing. -->
  <McpOverlay />

  <!-- Create component from a node (canvas + layers context menus) -->
  <ModalUi
    :open="!!createComponentNodeId"
    variant="dialog"
    icon="component"
    title="Create block"
    description="Save this element as a reusable block."
    @update:open="createComponentNodeId = null"
  >
    <div ref="componentNameInput">
      <InputUi v-model="componentName" placeholder="Block name" size="default" @keydown.enter="doCreateComponent" />
    </div>
    <template #actions>
      <ButtonUi variant="ghost" @click="createComponentNodeId = null">Cancel</ButtonUi>
      <ButtonUi variant="default" @click="doCreateComponent">Create</ButtonUi>
    </template>
  </ModalUi>
</template>
