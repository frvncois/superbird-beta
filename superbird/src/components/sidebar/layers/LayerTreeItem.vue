<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import type { CanvasNode } from '@/types/canvas'
import IconUi from '@/components/ui/IconUi.vue'

// Maps node types to icon registry keys (body reuses the layers glyph,
// section/column reuse the container square)
const TYPE_ICONS: Record<string, string> = {
  component: 'component',
  body: 'layers',
  container: 'container',
  section: 'section',
  column: 'container',
  columns: 'columns',
  heading: 'heading',
  text: 'text',
  button: 'button',
  image: 'image',
}

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
const globalStylesStore = useGlobalStylesStore()
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
  const bp = globalStylesStore.activeBreakpoint
  return (bp === 'desktop' && vis.hideDesktop) ||
    (bp === 'tablet' && vis.hideTablet) ||
    (bp === 'mobile' && vis.hideMobile)
})
const hasChildren = computed(() => props.node.children.length > 0)

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
        v-if="hasChildren"
        class="flex size-4 shrink-0 items-center justify-center rounded cursor-pointer hover:bg-secondary/15"
        @click="toggleExpand"
      >
        <IconUi
          name="chevron-right"
          size="size-3"
          :class="['text-secondary transition-transform duration-150', expanded && 'rotate-90']"
        />
      </button>
      <span v-else class="size-4 shrink-0" />

      <!-- Type icon -->
      <span class="ml-0.5 mr-1.5 shrink-0">
        <!-- Collection list -->
        <span v-if="node.type === 'collection-list'" class="text-[11px] font-mono font-bold text-amber-fg">&#8634;</span>
        <!-- Collection item -->
        <span v-else-if="node.type === 'collection-item'" class="text-[11px] font-mono font-bold text-amber-fg/60">&#8634;</span>
        <!-- Component instance -->
        <IconUi v-else-if="node.type === 'component'" name="component" size="size-3.5" class="text-green-fg" />
        <!-- Other node types -->
        <IconUi v-else-if="TYPE_ICONS[node.type]" :name="TYPE_ICONS[node.type]!" size="size-3.5" class="text-secondary" />
      </span>

      <!-- Label -->
      <span :class="['truncate text-xs', isSelected && 'font-medium', isHiddenAtBreakpoint && 'line-through opacity-50']">
        {{ node.label }}
      </span>

      <!-- Hidden indicator -->
      <IconUi
        v-if="isHiddenAtBreakpoint"
        name="eye-slash"
        size="size-2.5"
        class="shrink-0 text-secondary/40 ml-auto"
        title="Hidden at this breakpoint"
      />

      <!-- Dynamic field indicator -->
      <IconUi
        v-else-if="isDynamic"
        name="link"
        size="size-2.5"
        class="shrink-0 text-purple-fg/60 ml-auto"
        title="Dynamic field"
      />
    </div>

    <!-- Drop indicator: after -->
    <div v-if="!isBody && dropPosition === 'after'" class="layer-drop-line" :style="{ marginLeft: `${indent + 16}px` }" />

    <!-- Children -->
    <div v-if="expanded && hasChildren">
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
