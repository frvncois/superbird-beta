<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { deleteNodeWithUndo } from '@/composables/useNodeContextMenu'
import type { CanvasNode } from '@/types/canvas'
import IconUi from '@/components/ui/IconUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

// Maps every node type to an icon registry key so nothing renders iconless.
// (`body` reuses the layers glyph; icon keys otherwise match the type name.)
const TYPE_ICONS: Record<string, string> = {
  component: 'component',
  body: 'layers',
  container: 'container',
  section: 'section',
  div: 'div',
  columns: 'columns',
  column: 'column',
  heading: 'heading',
  text: 'text',
  markdown: 'markdown',
  link: 'link',
  span: 'span',
  list: 'list',
  'list-item': 'list',
  blockquote: 'blockquote',
  image: 'image',
  video: 'video',
  embed: 'embed',
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  label: 'label',
  'file-upload': 'upload',
  button: 'button',
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
  const bp = globalStylesStore.activeDevice
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

// Row hover actions — same behaviour as the context menu (delete shows an Undo toast).
function duplicate(e: MouseEvent) {
  e.stopPropagation()
  store.duplicateNode(props.node.id)
}
function remove(e: MouseEvent) {
  e.stopPropagation()
  deleteNodeWithUndo(props.node.id)
}
</script>

<template>
  <div :class="['transition-opacity duration-150', isDragged && 'opacity-30']">
    <!-- Drop indicator: before -->
    <div v-if="!isBody && dropPosition === 'before'" class="h-0.5 mr-2 rounded-[1px] bg-primary pointer-events-none" :style="{ marginLeft: `${indent + 16}px` }" />

    <!-- Row -->
    <div
      :data-layer-id="node.id"
      :class="[
        'group flex items-center h-7 pr-2 cursor-pointer rounded-xl select-none transition-[background-color,box-shadow] duration-100',
        isSelected && !isDragged && isComponent
          ? 'bg-green-bg text-green-fg'
          : isSelected && !isDragged && isDynamic
            ? 'bg-purple-bg text-purple-fg'
            : isSelected && !isDragged
              ? 'bg-primary/10 text-foreground'
              : 'text-foreground/80 hover:bg-secondary/8',
        dropPosition === 'inside' && 'shadow-[inset_0_0_0_1.5px_var(--color-primary)]',
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
      <ButtonUi
        v-if="hasChildren"
        variant="bare"
        class="size-4 shrink-0"
        @click="toggleExpand"
      >
        <IconUi
          name="chevron-right"
          size="size-3"
          :class="['text-secondary transition-transform duration-150', expanded && 'rotate-90']"
        />
      </ButtonUi>
      <span v-else class="size-4 shrink-0" />

      <!-- Type icon -->
      <span class="ml-0.5 mr-1.5 shrink-0">
        <!-- Collection list -->
        <IconUi v-if="node.type === 'collection-list'" name="collection-list" size="size-3.5" class="text-amber-fg" />
        <!-- Collection item -->
        <IconUi v-else-if="node.type === 'collection-item'" name="collection-item" size="size-3.5" class="text-amber-fg/70" />
        <!-- Component instance -->
        <IconUi v-else-if="node.type === 'component'" name="component" size="size-3.5" class="text-green-fg" />
        <!-- Other node types -->
        <IconUi v-else-if="TYPE_ICONS[node.type]" :name="TYPE_ICONS[node.type]!" size="size-3.5" class="text-secondary" />
      </span>

      <!-- Label -->
      <span :class="['truncate text-xs', isSelected && 'font-medium', isHiddenAtBreakpoint && 'line-through opacity-50']">
        {{ node.label }}
      </span>

      <!-- Right rail: status indicators, swapped for actions on row hover -->
      <div class="ml-auto flex shrink-0 items-center gap-0.5 pl-1">
        <!-- Hidden indicator -->
        <IconUi
          v-if="isHiddenAtBreakpoint"
          name="eye-slash"
          size="size-2.5"
          class="text-secondary/40 group-hover:hidden"
          title="Hidden at this breakpoint"
        />

        <!-- Dynamic field indicator -->
        <IconUi
          v-else-if="isDynamic"
          name="link"
          size="size-2.5"
          class="text-purple-fg/60 group-hover:hidden"
          title="Dynamic field"
        />

        <!-- Hover actions -->
        <span v-if="!isBody" class="hidden items-center gap-0.5 group-hover:flex">
          <ButtonUi variant="bare" square size="xs" icon="duplicate" title="Duplicate" @click="duplicate" />
          <ButtonUi variant="bare" square size="xs" icon="delete" title="Delete" @click="remove" />
        </span>
      </div>
    </div>

    <!-- Drop indicator: after -->
    <div v-if="!isBody && dropPosition === 'after'" class="h-0.5 mr-2 rounded-[1px] bg-primary pointer-events-none" :style="{ marginLeft: `${indent + 16}px` }" />

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
