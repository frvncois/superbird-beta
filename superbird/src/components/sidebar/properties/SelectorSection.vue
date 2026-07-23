<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useDialog } from '@/composables/useDialog'
import ClassInputUi from '@/components/ui/ClassInputUi.vue'
import { useNodeStyles } from './useNodeStyles'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const dialog = useDialog()
const { node } = useNodeStyles()

// After Duplicate, ask the input to open the new class in inline-rename mode.
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

// Delete entirely — from the registry and every element that uses it.
async function deleteClass(name: string) {
  const ok = await dialog.confirm({
    title: 'Delete class',
    message: `Delete “.${name}” from every element that uses it? This can’t be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (ok) store.deleteStyleClass(name)
}

// Duplicate into a new class (styles copied), swapped in on this element, then
// opened for renaming.
function duplicateClass(name: string) {
  if (!node.value) return
  const newName = store.duplicateClass(node.value.id, name)
  if (newName) {
    globalStylesStore.noteClassUsed(newName)
    pendingRename.value = newName
  }
}

// Rename everywhere it's used.
function renameClass(oldName: string, newName: string) {
  store.renameClass(oldName, newName)
  globalStylesStore.noteClassUsed(newName)
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
      v-model:rename-target="pendingRename"
      @add="addClass"
      @remove="removeClass"
      @select="selectClass"
      @delete="deleteClass"
      @duplicate="duplicateClass"
      @rename="renameClass"
      @update:active-state="globalStylesStore.setActiveState"
    />
  </section>
</template>
