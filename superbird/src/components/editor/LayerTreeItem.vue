<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { CanvasNode } from '@/types/canvas'

const props = defineProps<{
  node: CanvasNode
  depth: number
}>()

const emit = defineEmits<{
  select: [id: string, e: MouseEvent]
  'contextmenu-node': [e: MouseEvent, node: CanvasNode]
  'dragstart-node': [e: DragEvent, node: CanvasNode]
  'dragend-node': []
  'dragover-node': [e: DragEvent, node: CanvasNode]
  'dragleave-node': [e: DragEvent]
  'drop-node': [e: DragEvent, node: CanvasNode]
}>()

const store = useCanvasStore()
const expanded = ref(true)
const dropTarget = inject<Ref<{ id: string; position: string } | null>>('layerDropTarget')

const isBody = computed(() => props.node.type === 'body')
const isComponent = computed(() => props.node.type === 'component')
const isDynamic = computed(() => !!props.node.dynamicField)
const isSelected = computed(() => store.selectedNodeId === props.node.id)
const isDragged = computed(() => store.draggedNodeId === props.node.id)
const isHiddenAtBreakpoint = computed(() => {
  const vis = props.node.visibility
  if (!vis) return false
  const bp = store.activeBreakpoint
  return (bp === 'desktop' && vis.hideDesktop) ||
    (bp === 'tablet' && vis.hideTablet) ||
    (bp === 'mobile' && vis.hideMobile)
})
const hasChildren = computed(() => props.node.children.length > 0)
const isContainerType = computed(() =>
  ['body', 'container', 'section', 'columns', 'column', 'component'].includes(props.node.type),
)

const isDropTarget = computed(() => dropTarget?.value?.id === props.node.id)
const dropPosition = computed(() => isDropTarget.value ? dropTarget!.value!.position : null)

const indent = computed(() => props.depth * 16 + 8)

function toggleExpand(e: MouseEvent) {
  e.stopPropagation()
  expanded.value = !expanded.value
}
</script>

<template>
  <div :class="['layer-item', isDragged && 'opacity-30']">
    <!-- Drop indicator: before -->
    <div v-if="!isBody && dropPosition === 'before'" class="layer-drop-line" :style="{ marginLeft: `${indent + 16}px` }" />

    <!-- Row -->
    <div
      :class="[
        'layer-row group flex items-center h-7 pr-2 cursor-pointer mx-1 rounded',
        isSelected && !isDragged && isComponent
          ? 'bg-green-bg text-green-fg'
          : isSelected && !isDragged && isDynamic
            ? 'bg-purple-bg text-purple-fg'
            : isSelected && !isDragged
              ? 'bg-primary/10 text-foreground'
              : 'text-foreground/80 hover:bg-secondary/8',
        dropPosition === 'inside' && 'layer-drop-inside',
      ]"
      :style="{ paddingLeft: `${indent}px` }"
      :draggable="!isBody"
      @click="emit('select', node.id, $event)"
      @contextmenu.prevent="emit('contextmenu-node', $event, node)"
      @dragstart="emit('dragstart-node', $event, node)"
      @dragend="emit('dragend-node')"
      @dragover="emit('dragover-node', $event, node)"
      @dragleave="emit('dragleave-node', $event)"
      @drop="emit('drop-node', $event, node)"
    >
      <!-- Expand/collapse chevron -->
      <button
        v-if="isContainerType"
        class="flex size-4 shrink-0 items-center justify-center rounded cursor-pointer hover:bg-secondary/15"
        @click="toggleExpand"
      >
        <svg
          :class="['size-3 text-secondary transition-transform duration-150', expanded && 'rotate-90']"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd" />
        </svg>
      </button>
      <span v-else class="size-4 shrink-0" />

      <!-- Type icon -->
      <span class="ml-0.5 mr-1.5 shrink-0">
        <!-- Collection list -->
        <span v-if="node.type === 'collection-list'" class="text-[11px] font-mono font-bold text-amber-fg">&#8634;</span>
        <!-- Collection item -->
        <span v-else-if="node.type === 'collection-item'" class="text-[11px] font-mono font-bold text-amber-fg/60">&#8634;</span>
        <!-- Component instance -->
        <svg v-else-if="node.type === 'component'" class="size-3.5 text-green-fg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
        </svg>
        <svg v-else-if="node.type === 'body'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path d="M1 2.75A.75.75 0 0 1 1.75 2h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75ZM1 7.75A.75.75 0 0 1 1.75 7h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H1.75ZM1 17.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75Z" />
        </svg>
        <svg v-else-if="node.type === 'container' || node.type === 'section' || node.type === 'column'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13ZM3.5 3.5h13v13h-13v-13Z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="node.type === 'columns'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h13A1.5 1.5 0 0 1 18 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 16.5v-13ZM3.5 3.5v13h5.25v-13H3.5Zm6.75 0v13h6.25v-13h-6.25Z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="node.type === 'heading'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v4.5h6V4.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V10.5H5v5.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V4.25Z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="node.type === 'text'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h11.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75ZM2 7.5a.75.75 0 0 1 .75-.75h7.508a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.5ZM2.75 10.5a.75.75 0 0 0 0 1.5h11.5a.75.75 0 0 0 0-1.5H2.75ZM2 15.25a.75.75 0 0 1 .75-.75h7.508a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="node.type === 'button'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm2.25-.75a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h11.5a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75H4.25Z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="node.type === 'image'" class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 9.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.305l-3.47-3.47a.75.75 0 0 0-1.06 0l-3.72 3.72-2.22-2.22a.75.75 0 0 0-1.06 0L2.5 12.94v1.81Zm0-4.94 2.22-2.22a2.25 2.25 0 0 1 3.182 0l.97.97 3.47-3.47a2.25 2.25 0 0 1 3.182 0L17.5 7.06V5.25a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v4.56Z" clip-rule="evenodd" />
        </svg>
      </span>

      <!-- Label -->
      <span :class="['truncate text-xs', isSelected && 'font-medium', isHiddenAtBreakpoint && 'line-through opacity-50']">
        {{ node.label }}
      </span>

      <!-- Hidden indicator -->
      <svg v-if="isHiddenAtBreakpoint" class="size-2.5 shrink-0 text-secondary/40 ml-auto" viewBox="0 0 20 20" fill="currentColor" title="Hidden at this breakpoint">
        <path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.092 1.092a4 4 0 0 0-5.558-5.558Z" clip-rule="evenodd" />
        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
      </svg>

      <!-- Dynamic field indicator -->
      <svg v-else-if="isDynamic" class="size-2.5 shrink-0 text-purple-fg/60 ml-auto" viewBox="0 0 20 20" fill="currentColor" title="Dynamic field">
        <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
        <path d="M7.768 15.768a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 0 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3Z" />
      </svg>
    </div>

    <!-- Drop indicator: after -->
    <div v-if="!isBody && dropPosition === 'after'" class="layer-drop-line" :style="{ marginLeft: `${indent + 16}px` }" />

    <!-- Children -->
    <div v-if="isContainerType && expanded && hasChildren">
      <LayerTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        @select="(id, e) => emit('select', id, e)"
        @contextmenu-node="(e, n) => emit('contextmenu-node', e, n)"
        @dragstart-node="(e, n) => emit('dragstart-node', e, n)"
        @dragend-node="() => emit('dragend-node')"
        @dragover-node="(e, n) => emit('dragover-node', e, n)"
        @dragleave-node="(e) => emit('dragleave-node', e)"
        @drop-node="(e, n) => emit('drop-node', e, n)"
      />
    </div>
  </div>
</template>

<style scoped>
.layer-item {
  transition: opacity 0.15s ease;
}

.layer-row {
  user-select: none;
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
}

.layer-drop-line {
  height: 2px;
  margin-right: 8px;
  border-radius: 1px;
  background: var(--color-primary);
  pointer-events: none;
}

.layer-drop-inside {
  box-shadow: inset 0 0 0 1.5px var(--color-primary);
  border-radius: 6px;
}
</style>
