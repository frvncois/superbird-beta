<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useMediaStore } from '@/stores/media'
import { CONTAINER_TYPES, TEXT_EDITABLE_TYPES } from '@/constants/canvas'
import type { CanvasNode, Entry } from '@/types/canvas'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import NodePlaceholder from '@/components/canvas/NodePlaceholder.vue'
import { useNodeDnD } from '@/components/canvas/useNodeDnD'
import { useContextMenu } from '@/composables/useContextMenu'
import { buildNodeActions } from '@/composables/useNodeContextMenu'
import { useInteractionRunner } from '@/composables/useInteractionRunner'

const props = defineProps<{
  node: CanvasNode
  depth?: number
  // When set, this subtree is a read-only collection-list preview populated by
  // this entry: field-bound nodes resolve their content from it, and all
  // editor interactions (select / edit / drag / context menu) are disabled.
  renderEntry?: Entry | null
  preview?: boolean
}>()

const store = useCanvasStore()
const collectionsStore = useCollectionsStore()
const globalStylesStore = useGlobalStylesStore()
const mediaStore = useMediaStore()
const isEditing = ref(false)
const isHovered = ref(false)
const editableRef = ref<HTMLElement | null>(null)
const nodeRef = ref<HTMLElement | null>(null)

// Run interactions (never in a preview copy — they'd double up).
const nodeInteractions = computed(() => (props.preview ? undefined : props.node.interactions))
useInteractionRunner(nodeRef, nodeInteractions)

// Drag & drop (drag source + drop target)
const { dropPosition, handleDragStart, handleDragOver, handleDragLeave, handleDrop } =
  useNodeDnD(toRef(props, 'node'))

const isSelected = computed(() => !props.preview && store.selectedNodeId === props.node.id)
const isBody = computed(() => props.node.type === 'body')
const isComponentInstance = computed(() => props.node.type === 'component')
const isContainer = computed(() => CONTAINER_TYPES.includes(props.node.type))
const isTextEditable = computed(() => TEXT_EDITABLE_TYPES.includes(props.node.type))
const isPlaceholder = computed(() =>
  ['image', 'video', 'embed', 'input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload'].includes(props.node.type),
)
const isDynamic = computed(() => !!props.node.dynamicField)

// Resolve a node's content, preferring the preview entry when this subtree is
// a collection-list preview; otherwise the store (which handles the active entry
// / locale). Used for text and image fields.
function nodeContent(node: CanvasNode): string {
  if (node.dynamicField && props.renderEntry) {
    return props.renderEntry.values[node.dynamicField] ?? node.content ?? ''
  }
  return store.getNodeContent(node)
}

const imageMedia = computed(() => {
  if (props.node.type !== 'image') return null
  const value = nodeContent(props.node)
  if (!value) return null
  return mediaStore.mediaItems.find((m) => m.id === value) ?? null
})

// Real entries to populate a collection-list preview (capped at its limit).
const previewEntries = computed<Entry[]>(() => {
  if (props.node.type !== 'collection-list') return []
  const col = collectionsStore.collectionById(props.node.props.source)
  if (!col) return []
  const limit = parseInt(props.node.props.limit ?? '3', 10) || 3
  return collectionsStore.entriesByCollection(col.id).slice(0, limit)
})

const isDesktop = computed(() => globalStylesStore.activeBreakpoint === 'desktop')
const isHiddenAtBreakpoint = computed(() => {
  const vis = props.node.visibility
  if (!vis) return false
  const bp = globalStylesStore.activeBreakpoint
  return (bp === 'desktop' && vis.hideDesktop) ||
    (bp === 'tablet' && vis.hideTablet) ||
    (bp === 'mobile' && vis.hideMobile)
})
const computedStyles = computed(() => globalStylesStore.resolveStyles(props.node))
const ctx = useContextMenu()

function handleClick(e: MouseEvent) {
  if (props.preview) return
  e.stopPropagation()
  store.selectNode(props.node.id)
}

function handleContextMenu(e: MouseEvent) {
  if (props.preview) return
  e.stopPropagation()
  store.selectNode(props.node.id)
  ctx.open(e, buildNodeActions(props.node, 'canvas'))
}

function handleDoubleClick(e: MouseEvent) {
  if (props.preview) return
  // Image nodes: double-click to choose media (stored per-entry or on template).
  if (props.node.type === 'image') {
    e.stopPropagation()
    mediaStore.openPicker((item) => store.setNodeContent(props.node.id, item.id))
    return
  }
  if (!isTextEditable.value) return
  e.stopPropagation()
  isEditing.value = true
  requestAnimationFrame(() => editableRef.value?.focus())
}

function handleBlur() {
  if (!isEditing.value) return
  isEditing.value = false
  const text = editableRef.value?.textContent ?? ''
  store.setNodeContent(props.node.id, text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
    e.preventDefault()
    editableRef.value?.blur()
  }
}

// Drag & drop wrappers — inert on preview copies.
function onDragStart(e: DragEvent) { if (props.preview) { e.preventDefault(); return } handleDragStart(e) }
function onDragOver(e: DragEvent) { if (props.preview) return; handleDragOver(e) }
function onDragLeave(e: DragEvent) { if (props.preview) return; handleDragLeave(e) }
function onDrop(e: DragEvent) { if (props.preview) return; handleDrop(e) }
</script>

<template>
  <div
    ref="nodeRef"
    data-canvas-node
    :data-node-id="preview ? undefined : node.id"
    :class="[
      'canvas-node relative',
      isBody && isDesktop && 'bg-background h-full',
      isBody && !isDesktop && 'rounded-2xl border bg-background shadow-sm min-h-full',
      isSelected && !isComponentInstance && !isDynamic && 'ring-2 ring-primary ring-offset-1',
      isSelected && isComponentInstance && 'ring-2 ring-green-fg ring-offset-1',
      isSelected && isDynamic && !isComponentInstance && 'ring-2 ring-purple-fg ring-offset-1',
      !isSelected && !preview && isComponentInstance && 'ring-1 ring-green-fg/20',
      !isSelected && !preview && isDynamic && !isComponentInstance && 'ring-1 ring-purple-fg/20',
      dropPosition === 'inside' && 'bg-primary/5',
      isHiddenAtBreakpoint && 'opacity-30',
    ]"
    :style="computedStyles"
    :id="node.htmlId || undefined"
    :title="node.htmlTitle || undefined"
    :role="node.accessibility?.role || undefined"
    :aria-label="node.accessibility?.ariaLabel || undefined"
    :draggable="!isEditing && !isBody && !preview"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @dblclick="handleDoubleClick"
    @mouseenter.self="isHovered = true"
    @mouseleave.self="isHovered = false"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Hover outline -->
    <div
      v-if="isHovered && !isSelected && !isBody && !preview"
      class="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
      :class="isComponentInstance ? 'ring-1 ring-green-fg/50' : isDynamic ? 'ring-1 ring-purple-fg/50' : 'ring-1 ring-primary/50'"
    />

    <!-- Hover label -->
    <div
      v-if="isHovered && !isSelected && !isBody && !preview"
      class="pointer-events-none absolute -top-5 left-0 z-20 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono leading-none text-white"
      :class="isComponentInstance ? 'bg-green-fg' : isDynamic ? 'bg-purple-fg' : 'bg-primary'"
    >
      <IconUi v-if="isComponentInstance" name="component" size="size-2.5" />
      <IconUi v-else-if="isDynamic" name="link" size="size-2.5" />
      {{ node.label }}
    </div>
    <!-- Drop indicator: before (not for body) -->
    <div
      v-if="!isBody && !preview && dropPosition === 'before'"
      class="absolute -top-px left-0 right-0 h-0.5 bg-primary z-10"
    />

    <!-- Node content -->
    <div
      v-if="isTextEditable"
      ref="editableRef"
      :contenteditable="isEditing"
      :class="[
        'outline-none',
        node.type === 'heading' && 'text-2xl font-semibold',
        node.type === 'text' && 'text-sm',
        isEditing && 'cursor-text ring-1 ring-primary/30 rounded px-1',
      ]"
      @blur="handleBlur"
      @keydown="handleKeydown"
      v-text="nodeContent(node)"
    />

    <!-- Container / Body: render children -->
    <template v-else-if="isContainer">
      <!-- Collection List indicator -->
      <div v-if="node.type === 'collection-list' && !preview" class="flex items-center gap-1.5 px-2 py-1 mb-1 rounded-lg bg-amber-bg/50 text-[10px] font-mono text-amber-fg">
        <span>&#8634;</span>
        <span>{{ collectionsStore.collectionById(node.props.source)?.name ?? node.props.source ?? 'Collection' }}</span>
        <span class="text-amber-fg/50">&#183; {{ previewEntries.length || (node.props.limit ?? '3') }} items</span>
      </div>

      <!-- Collection Item indicator (only on the editable template, not previews) -->
      <div v-if="node.type === 'collection-item' && !preview" class="flex items-center gap-1 px-2 py-0.5 mb-1 rounded bg-amber-bg/30 text-[9px] font-mono text-amber-fg/70">
        Repeating item
      </div>

      <!-- Collection list with real entries → one read-only copy of the item template per entry -->
      <template v-if="node.type === 'collection-list' && previewEntries.length > 0">
        <template v-for="entry in previewEntries" :key="entry.id">
          <CanvasNodeRenderer
            v-for="child in node.children"
            :key="child.id + '@' + entry.id"
            :node="child"
            :render-entry="entry"
            :preview="true"
            :depth="(depth ?? 0) + 1"
          />
        </template>
      </template>

      <!-- Normal children (editable, or a preview subtree threading its entry down) -->
      <template v-else>
        <CanvasNodeRenderer
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :render-entry="renderEntry"
          :preview="preview"
          :depth="(depth ?? 0) + 1"
        />
      </template>

      <!-- Empty state -->
      <div
        v-if="node.children.length === 0 && !preview"
        :class="[
          'flex items-center justify-center text-xs text-secondary',
          isBody ? 'py-32' : 'border border-dashed rounded-xl py-8',
        ]"
      >
        {{ isBody ? 'Drag components from the sidebar to start building' : 'Drop elements here' }}
      </div>
    </template>

    <!-- Image / media / form placeholders -->
    <NodePlaceholder v-else-if="isPlaceholder" :node="node" :media="imageMedia" />

    <!-- Drop indicator: after (not for body) -->
    <div
      v-if="!isBody && !preview && dropPosition === 'after'"
      class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary z-10"
    />

    <!-- Context menu -->
    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />
  </div>
</template>

<style scoped>
.canvas-node {
  cursor: default;
  transition: box-shadow 0.15s ease, background-color 0.15s ease;
}
</style>
