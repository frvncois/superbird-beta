<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import type { CssMode } from '@/types/canvas'
import ClassInputUi from '@/components/ui/ClassInputUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import { useNodeStyles } from './useNodeStyles'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const siteSettings = useSiteSettingsStore()
const { node } = useNodeStyles()

const cssModeOptions = [
  { value: 'custom', label: 'Custom' },
  { value: 'tailwind', label: 'Tailwind' },
]

function addClass(name: string) {
  if (!node.value) return
  store.addClassToNode(node.value.id, name)
  globalStylesStore.noteClassUsed(name)
}

function removeClass(name: string) {
  if (!node.value) return
  store.removeClassFromNode(node.value.id, name)
}

function selectClass(name: string) {
  globalStylesStore.setActiveClass(name)
  globalStylesStore.noteClassUsed(name)
}
</script>

<template>
  <section v-if="node" class="space-y-2.5 p-4">
    <div class="flex items-center justify-between">
      <LabelUi>CSS</LabelUi>
      <SegmentedControlUi
        :model-value="siteSettings.siteSettings.cssMode"
        :options="cssModeOptions"
        size="xs"
        @update:model-value="siteSettings.setCssMode($event as CssMode)"
      />
    </div>
    <ClassInputUi
      :classes="node.classes"
      :active-class="globalStylesStore.activeClassName"
      :active-state="globalStylesStore.activeState"
      :all-class-names="globalStylesStore.allClassNames"
      :recent-classes="globalStylesStore.recentClasses"
      @add="addClass"
      @remove="removeClass"
      @select="selectClass"
      @update:active-state="globalStylesStore.setActiveState"
    />
  </section>
</template>
