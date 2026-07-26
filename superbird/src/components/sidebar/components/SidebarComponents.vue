<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useUserComponentsStore } from '@/stores/userComponents'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { useToast } from '@/composables/useToast'
import { separator, filterMenuItems, type ContextMenuItem } from '@/types/contextMenu'

const store = useCanvasStore()
const componentsStore = useUserComponentsStore()
const ctx = useContextMenu()
const toast = useToast()

const pendingDelete = ref<{ id: string; name: string } | null>(null)

function confirmDeleteComponent(compId: string, name: string) {
  pendingDelete.value = { id: compId, name }
}

function doDeleteComponent() {
  const target = pendingDelete.value
  if (!target) return
  componentsStore.deleteComponent(target.id)
  toast.success(`Component “${target.name}” deleted`)
  pendingDelete.value = null
}

const userComponentsList = computed(() => Object.values(componentsStore.userComponents))

function handleUserComponentDragStart(e: DragEvent, compId: string) {
  e.dataTransfer!.effectAllowed = 'copyMove'
  e.dataTransfer!.setData('application/superbird-user-component', compId)
}

function handleDragEnd() {
  store.setDraggedComponent(null)
}

function handleUserComponentContextMenu(e: MouseEvent, compId: string) {
  const comp = componentsStore.userComponents[compId]
  if (!comp) return

  const items: ContextMenuItem[] = filterMenuItems([
    {
      id: 'add-to-page',
      label: 'Add to Page',
      icon: 'add',
      handler: () => componentsStore.addComponentToPage(compId),
    },
    {
      id: 'add-inside-selected',
      label: 'Add Inside Selected',
      icon: 'add',
      handler: () => {
        if (store.selectedNode) componentsStore.addComponentToPage(compId, store.selectedNode.id, 'inside')
      },
      hidden: !store.selectedNode || !store.isContainerNode(store.selectedNode.id),
    },
    separator(),
    {
      id: 'delete-component',
      label: `Delete "${comp.name}"`,
      icon: 'delete',
      danger: true,
      handler: () => confirmDeleteComponent(compId, comp.name),
    },
  ])
  ctx.open(e, items)
}
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- User components -->
    <div v-if="userComponentsList.length > 0">
      <LabelUi size="xs">Components</LabelUi>
      <div class="space-y-0.5">
        <div
          v-for="comp in userComponentsList"
          :key="comp.id"
          class="flex cursor-grab items-center gap-2.5 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-secondary/10 active:cursor-grabbing"
          draggable="true"
          @dragstart="handleUserComponentDragStart($event, comp.id)"
          @dragend="handleDragEnd"
          @contextmenu.prevent="handleUserComponentContextMenu($event, comp.id)"
        >
          <div class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-green-bg">
            <IconUi name="component" size="size-3" class="text-green-fg" />
          </div>
          <div>
            <div class="text-xs font-medium text-foreground">{{ comp.name }}</div>
            <div class="text-[10px] text-secondary">{{ componentsStore.getComponentInstanceCount(comp.id) }} instances</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="userComponentsList.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <div class="text-xs text-secondary">No components yet</div>
      <div class="text-[10px] text-secondary/50 mt-1">Right-click an element and select "Create Component"</div>
    </div>

    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />

    <ModalUi
      :open="!!pendingDelete"
      variant="dialog"
      danger
      icon="alert"
      title="Delete component"
      :description="
        pendingDelete
          ? `Delete “${pendingDelete.name}”? Instances placed on your pages will be detached. This can’t be undone.`
          : ''
      "
      @update:open="pendingDelete = null"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingDelete = null">Cancel</ButtonUi>
        <ButtonUi variant="danger" @click="doDeleteComponent">Delete</ButtonUi>
      </template>
    </ModalUi>
  </div>
</template>
