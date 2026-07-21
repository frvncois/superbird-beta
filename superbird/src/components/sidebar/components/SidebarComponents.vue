<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useUserComponentsStore } from '@/stores/userComponents'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { separator, filterMenuItems, type ContextMenuItem } from '@/types/contextMenu'

const store = useCanvasStore()
const componentsStore = useUserComponentsStore()
const ctx = useContextMenu()

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
      handler: () => componentsStore.deleteComponent(compId),
    },
  ])
  ctx.open(e, items)
}
</script>

<template>
  <div class="p-2 space-y-3">
    <!-- User components -->
    <div v-if="userComponentsList.length > 0">
      <div class="px-2 pb-1 text-[9px] font-mono uppercase tracking-wider text-secondary/50">Components</div>
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
            <svg class="size-3 text-green-fg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
            </svg>
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
  </div>
</template>
