<script setup lang="ts">
import { ref, computed, toRef, inject } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useMediaStore } from '@/stores/media'
import { CONTAINER_TYPES, TEXT_EDITABLE_TYPES, CONTENT_TYPES } from '@/constants/canvas'
import { renderMarkdown } from '@/lib/markdown'
import type { CanvasNode, Entry } from '@/types/canvas'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import NodePlaceholder from '@/components/canvas/NodePlaceholder.vue'
import { useNodeDnD } from '@/components/canvas/useNodeDnD'
import { useContextMenu } from '@/composables/useContextMenu'
import { buildNodeActions } from '@/composables/useNodeContextMenu'
import { useInteractionRunner } from '@/composables/useInteractionRunner'
import { CreateComponentPromptKey } from '@/constants/injectionKeys'

const props = defineProps<{
  node: CanvasNode
  depth?: number
  renderEntry?: Entry | null
  preview?: boolean
}>()

const store = useCanvasStore()
const collectionsStore = useCollectionsStore()
const globalStylesStore = useGlobalStylesStore()
const mediaStore = useMediaStore()
const promptCreateComponent = inject(CreateComponentPromptKey)
const isEditing = ref(false)
const isHovered = ref(false)
const editableRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const nodeRef = ref<HTMLElement | null>(null)
const draft = ref('')

const nodeInteractions = computed(() => (props.preview ? undefined : props.node.interactions))
useInteractionRunner(nodeRef, nodeInteractions)

const { dropPosition, handleDragStart, handleDragOver, handleDragLeave, handleDrop } =
  useNodeDnD(toRef(props, 'node'))

const isSelected = computed(() => !props.preview && store.selectedNodeId === props.node.id)
const isBody = computed(() => props.node.type === 'body')
const isComponentInstance = computed(() => props.node.type === 'component')
const isContainer = computed(() => CONTAINER_TYPES.includes(props.node.type))
const isTextEditable = computed(() => TEXT_EDITABLE_TYPES.includes(props.node.type))
const isMarkdown = computed(() => props.node.type === 'markdown')
const isPlaceholder = computed(() =>
  ['image', 'video', 'embed', 'input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload'].includes(props.node.type),
)
const isDynamic = computed(() => !!props.node.dynamicField)
const showOutlines = computed(
  () => store.editorMode === 'design' || CONTENT_TYPES.includes(props.node.type),
)

function nodeContent(node: CanvasNode): string {
  if (node.dynamicField && props.renderEntry) {
    return props.renderEntry.values[node.dynamicField] ?? node.content ?? ''
  }
  return store.getNodeContent(node)
}

const markdownHtml = computed(() => renderMarkdown(nodeContent(props.node)))
const draftHtml = computed(() => renderMarkdown(draft.value))

const imageMedia = computed(() => {
  if (props.node.type !== 'image') return null
  const value = nodeContent(props.node)
  if (!value) return null
  return mediaStore.mediaItems.find((m) => m.id === value) ?? null
})

const previewEntries = computed<Entry[]>(() => {
  if (props.node.type !== 'collection-list') return []
  const col = collectionsStore.collectionById(props.node.props.source)
  if (!col) return []
  const limit = Math.min(100, Math.max(0, parseInt(props.node.props.limit ?? '3', 10) || 3))
  return collectionsStore.entriesByCollection(col.id).slice(0, limit)
})

const isBaseViewport = computed(() => globalStylesStore.isBaseViewport)
const isHiddenAtBreakpoint = computed(() => {
  const vis = props.node.visibility
  if (!vis) return false
  const bp = globalStylesStore.activeDevice
  return (bp === 'desktop' && vis.hideDesktop) ||
    (bp === 'tablet' && vis.hideTablet) ||
    (bp === 'mobile' && vis.hideMobile)
})
const computedStyles = computed(() => globalStylesStore.resolveStyles(props.node))

// The editor renders every node as a <div>, so heading/text elements lose the
// browser's tag defaults; we fake a heading/body look on the editable content
// with utility classes — but ONLY where the node has no font-size/weight of its
// own (from a class or instance style, both surfaced in computedStyles), so real
// typography edits win instead of being clobbered by the fallback.
const contentDefaults = computed(() => {
  const s = computedStyles.value
  if (props.node.type === 'heading') {
    return [!s['font-size'] && 'text-2xl', !s['font-weight'] && 'font-semibold']
  }
  if (props.node.type === 'text' && !s['font-size']) return ['text-sm']
  return []
})

const ctx = useContextMenu()

function onClick(e: MouseEvent) {
  if (props.preview) return
  e.stopPropagation()
  store.selectNode(props.node.id)
}

function onContextMenu(e: MouseEvent) {
  if (props.preview) return
  e.stopPropagation()
  store.selectNode(props.node.id)
  ctx.open(e, buildNodeActions(props.node, 'canvas', {
    onCreateComponent: () => promptCreateComponent?.(props.node.id),
  }))
}

function onDoubleClick(e: MouseEvent) {
  if (props.preview) return
  if (props.node.type === 'image') {
    e.stopPropagation()
    mediaStore.openPicker((item) => store.setNodeContent(props.node.id, item.id))
    return
  }
  if (isMarkdown.value) {
    e.stopPropagation()
    draft.value = nodeContent(props.node)
    isEditing.value = true
    requestAnimationFrame(() => textareaRef.value?.focus())
    return
  }
  if (!isTextEditable.value) return
  e.stopPropagation()
  isEditing.value = true
  requestAnimationFrame(() => editableRef.value?.focus())
}

function onBlur() {
  if (!isEditing.value) return
  isEditing.value = false
  if (isMarkdown.value) {
    store.setNodeContent(props.node.id, draft.value)
    return
  }
  const text = editableRef.value?.textContent ?? ''
  store.setNodeContent(props.node.id, text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
    e.preventDefault()
    editableRef.value?.blur()
  }
}

function onMarkdownKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    textareaRef.value?.blur()
  }
}

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
      'cursor-default transition-[box-shadow,background-color] duration-150 ease-[ease] relative',
      ...node.classes,
      isBody && isBaseViewport && 'bg-background h-full',
      isBody && !isBaseViewport && 'bg-background shadow-sm min-h-full',
      showOutlines && isSelected && !isComponentInstance && !isDynamic && 'ring-2 ring-primary ring-offset-1',
      showOutlines && isSelected && isComponentInstance && 'ring-2 ring-green-fg ring-offset-1',
      showOutlines && isSelected && isDynamic && !isComponentInstance && 'ring-2 ring-purple-fg ring-offset-1',
      showOutlines && !isSelected && !preview && isComponentInstance && 'ring-1 ring-green-fg/20',
      showOutlines && !isSelected && !preview && isDynamic && !isComponentInstance && 'ring-1 ring-purple-fg/20',
      dropPosition === 'inside' && 'bg-primary/5',
      isHiddenAtBreakpoint && 'opacity-30',
    ]"
    :style="computedStyles"
    :id="node.htmlId || undefined"
    :title="node.htmlTitle || undefined"
    :role="node.accessibility?.role || undefined"
    :aria-label="node.accessibility?.ariaLabel || undefined"
    :draggable="!isEditing && !isBody && !preview"
    @click="onClick"
    @contextmenu.prevent="onContextMenu"
    @dblclick="onDoubleClick"
    @mouseenter.self="isHovered = true"
    @mouseleave.self="isHovered = false"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      v-if="isHovered && !isSelected && !isBody && !preview && showOutlines"
      class="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
      :class="isComponentInstance ? 'ring-1 ring-green-fg/50' : isDynamic ? 'ring-1 ring-purple-fg/50' : 'ring-1 ring-primary/50'"
    />

    <div
      v-if="isHovered && !isSelected && !isBody && !preview && showOutlines"
      class="pointer-events-none absolute -top-5 left-0 z-20 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase not-italic tracking-wider leading-none whitespace-nowrap [text-indent:0] [word-spacing:normal] text-white"
      :class="isComponentInstance ? 'bg-green-fg' : isDynamic ? 'bg-purple-fg' : 'bg-primary'"
    >
      <IconUi v-if="isComponentInstance" name="component" size="size-2.5" />
      <IconUi v-else-if="isDynamic" name="link" size="size-2.5" />
      {{ node.label }}
    </div>
    <div
      v-if="!isBody && !preview && dropPosition === 'before'"
      class="absolute -top-px left-0 right-0 h-0.5 bg-primary z-10"
    />

    <div v-if="isMarkdown" class="w-full">
      <template v-if="isEditing">
        <textarea
          ref="textareaRef"
          v-model="draft"
          spellcheck="false"
          class="w-full min-h-24 resize-y rounded px-2 py-1.5 bg-transparent font-mono text-xs leading-relaxed text-foreground outline-none ring-1 ring-primary/30"
          @blur="onBlur"
          @keydown="onMarkdownKeydown"
        />
        <div class="mt-2 border-t border-border/60 pt-2">
          <LabelUi size="xs" class="mb-1 block text-secondary/60">Preview</LabelUi>
          <div class="markdown-body" v-html="draftHtml" />
        </div>
      </template>
      <div v-else class="markdown-body" v-html="markdownHtml" />
    </div>

    <div
      v-else-if="isTextEditable && node.children.length === 0"
      ref="editableRef"
      :contenteditable="isEditing"
      :class="[
        'outline-none',
        contentDefaults,
        isEditing && 'cursor-text ring-1 ring-primary/30 rounded px-1',
      ]"
      @blur="onBlur"
      @keydown="onKeydown"
      v-text="nodeContent(node)"
    />

    <template v-else-if="isContainer || node.children.length > 0">
      <div v-if="node.type === 'collection-list' && !preview" class="flex items-center gap-1.5 px-2 py-1 mb-1 rounded-lg bg-amber-bg/50 text-[10px] font-mono text-amber-fg">
        <span>&#8634;</span>
        <span>{{ collectionsStore.collectionById(node.props.source)?.name ?? node.props.source ?? 'Collection' }}</span>
        <span class="text-amber-fg/50">&#183; {{ previewEntries.length || (node.props.limit ?? '3') }} items</span>
      </div>

      <div v-if="node.type === 'collection-item' && !preview" class="flex items-center gap-1 px-2 py-0.5 mb-1 rounded bg-amber-bg/30 text-[9px] font-mono text-amber-fg/70">
        Repeating item
      </div>

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

    <NodePlaceholder v-else-if="isPlaceholder" :node="node" :media="imageMedia" />

    <div
      v-if="!isBody && !preview && dropPosition === 'after'"
      class="absolute -bottom-px left-0 right-0 h-0.5 bg-primary z-10"
    />

    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />
  </div>
</template>
