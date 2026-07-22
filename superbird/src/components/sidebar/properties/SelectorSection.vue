<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import ClassInputUi from '@/components/ui/ClassInputUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import { useNodeStyles } from './useNodeStyles'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const { node } = useNodeStyles()

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
  <section v-if="node" class="p-4">
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
