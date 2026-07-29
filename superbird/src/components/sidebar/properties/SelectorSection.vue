<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import ClassInputUi from '@/components/ui/ClassInputUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import { useNodeStyles } from './useNodeStyles'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const { node } = useNodeStyles()

const pendingRename = ref<string | null>(null)

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

const pendingDelete = ref<string | null>(null)
function deleteClass(name: string) {
  pendingDelete.value = name
}
function doDelete() {
  const target = pendingDelete.value
  if (!target) return
  store.deleteStyleClass(target)
  pendingDelete.value = null
}

function duplicateClass(name: string) {
  if (!node.value) return
  const newName = store.duplicateClass(node.value.id, name)
  if (newName) {
    globalStylesStore.noteClassUsed(newName)
    pendingRename.value = newName
  }
}

function renameClass(oldName: string, newName: string) {
  store.renameClass(oldName, newName)
  globalStylesStore.noteClassUsed(newName)
}
</script>

<template>
  <section v-if="node" class="py-3.5">
    <ClassInputUi
      :classes="node.classes"
      :active-class="globalStylesStore.activeClassName"
      :active-state="globalStylesStore.activeState"
      :all-class-names="globalStylesStore.allClassNames"
      :recent-classes="globalStylesStore.recentClasses"
      v-model:rename-target="pendingRename"
      @add="addClass"
      @remove="removeClass"
      @select="selectClass"
      @delete="deleteClass"
      @duplicate="duplicateClass"
      @rename="renameClass"
      @update:active-state="globalStylesStore.setActiveState"
    />

    <ConfirmDialogUi
      :open="!!pendingDelete"
      title="Delete class"
      :description="pendingDelete ? `Delete “.${pendingDelete}” from every element that uses it? This can’t be undone.` : ''"
      confirm-label="Delete"
      @update:open="pendingDelete = null"
      @confirm="doDelete"
    />
  </section>
</template>
