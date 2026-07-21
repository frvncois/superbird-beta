<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useUserComponentsStore } from '@/stores/userComponents'
import { CONTAINER_TYPES, TEXT_EDITABLE_TYPES } from '@/constants/canvas'
import type { CanvasNode } from '@/types/canvas'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import { useContextMenu, buildCanvasActions } from '@/composables/useContextMenu'
import { useInteractionRunner } from '@/composables/useInteractionRunner'

const props = defineProps<{
  node: CanvasNode
  depth?: number
}>()

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const componentsStore = useUserComponentsStore()
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)
const isEditing = ref(false)
const isHovered = ref(false)
const editableRef = ref<HTMLElement | null>(null)
const nodeRef = ref<HTMLElement | null>(null)

// Run interactions
const nodeInteractions = computed(() => props.node.interactions)
useInteractionRunner(nodeRef, nodeInteractions)

const isSelected = computed(() => store.selectedNodeId === props.node.id)
const isBody = computed(() => props.node.type === 'body')
const isComponentInstance = computed(() => props.node.type === 'component')
const isContainer = computed(() => CONTAINER_TYPES.includes(props.node.type))
const isTextEditable = computed(() => TEXT_EDITABLE_TYPES.includes(props.node.type))
const isFormElement = computed(() => ['input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload'].includes(props.node.type))
const isMediaPlaceholder = computed(() => ['video', 'embed'].includes(props.node.type))
const isDynamic = computed(() => !!props.node.dynamicField)
const isDesktop = computed(() => globalStylesStore.activeBreakpoint === 'desktop')
const isHiddenAtBreakpoint = computed(() => {
  const vis = props.node.visibility
  if (!vis) return false
  const bp = globalStylesStore.activeBreakpoint
  return (bp === 'desktop' && vis.hideDesktop) ||
    (bp === 'tablet' && vis.hideTablet) ||
    (bp === 'mobile' && vis.hideMobile)
})
const computedStyles = computed(() => {
  const classes = props.node.classes
  const instanceStyles = props.node.styles
  const classRegistry = globalStylesStore.styleClasses
  const bp = globalStylesStore.activeBreakpoint
  const merged: Record<string, string> = {}

  // Breakpoint cascade: desktop -> tablet -> mobile
  const cascade = bp === 'mobile' ? ['desktop', 'tablet', 'mobile'] as const
    : bp === 'tablet' ? ['desktop', 'tablet'] as const
    : ['desktop'] as const

  for (const name of classes) {
    const cls = classRegistry[name]
    if (!cls) continue
    for (const b of cascade) {
      const bpStyles = cls.styles[b]
      if (bpStyles?.default) Object.assign(merged, bpStyles.default)
    }
  }
  Object.assign(merged, instanceStyles)
  return merged
})
const ctx = useContextMenu()

function handleClick(e: MouseEvent) {
  e.stopPropagation()
  store.selectNode(props.node.id)
}

function handleContextMenu(e: MouseEvent) {
  e.stopPropagation()
  store.selectNode(props.node.id)
  ctx.open(e, buildCanvasActions(props.node))
}

function handleDoubleClick(e: MouseEvent) {
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

// --- Drag source (reorder) ---

function handleDragStart(e: DragEvent) {
  if (isBody.value) {
    e.preventDefault()
    return
  }
  e.stopPropagation()
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('application/superbird-node-id', props.node.id)
}

// --- Drop target ---

function getDropPosition(e: DragEvent): 'before' | 'after' | 'inside' {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const threshold = rect.height * 0.25

  if (isContainer.value && y > threshold && y < rect.height - threshold) {
    return 'inside'
  }
  return y < rect.height / 2 ? 'before' : 'after'
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer!.dropEffect = 'move'
  dropPosition.value = getDropPosition(e)
}

function handleDragLeave(e: DragEvent) {
  e.stopPropagation()
  dropPosition.value = null
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  const pos = dropPosition.value
  dropPosition.value = null

  if (!pos) return

  // Dropping a new component from sidebar
  const componentType = e.dataTransfer!.getData('application/superbird-component')
  if (componentType) {
    store.addNode(
      componentType as any,
      {},
      props.node.id,
      pos,
    )
    store.setDraggedComponent(null)
    return
  }

  // Dropping a dynamic field from sidebar
  const fieldKey = e.dataTransfer!.getData('application/superbird-dynamic-field')
  if (fieldKey) {
    const field = store.activePageFields.find((f) => f.key === fieldKey)
    if (field) store.addDynamicFieldElement(field, props.node.id, pos)
    return
  }

  // Dropping a user component from sidebar
  const userCompId = e.dataTransfer!.getData('application/superbird-user-component')
  if (userCompId) {
    componentsStore.addComponentToPage(userCompId, props.node.id, pos)
    return
  }

  // Reordering existing node
  const nodeId = e.dataTransfer!.getData('application/superbird-node-id')
  if (nodeId && nodeId !== props.node.id) {
    store.moveNode(nodeId, props.node.id, pos)
  }
}
</script>

<template>
  <div
    ref="nodeRef"
    :class="[
      'canvas-node relative',
      isBody && isDesktop && 'bg-background h-full',
      isBody && !isDesktop && 'rounded-2xl border bg-background shadow-sm min-h-full',
      isSelected && !isComponentInstance && !isDynamic && 'ring-2 ring-primary ring-offset-1',
      isSelected && isComponentInstance && 'ring-2 ring-green-fg ring-offset-1',
      isSelected && isDynamic && !isComponentInstance && 'ring-2 ring-purple-fg ring-offset-1',
      !isSelected && isComponentInstance && 'ring-1 ring-green-fg/20',
      !isSelected && isDynamic && !isComponentInstance && 'ring-1 ring-purple-fg/20',
      dropPosition === 'inside' && 'bg-primary/5',
      isHiddenAtBreakpoint && 'opacity-30',
    ]"
    :style="computedStyles"
    :id="node.htmlId || undefined"
    :title="node.htmlTitle || undefined"
    :role="node.accessibility?.role || undefined"
    :aria-label="node.accessibility?.ariaLabel || undefined"
    :draggable="!isEditing && !isBody"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @dblclick="handleDoubleClick"
    @mouseenter.self="isHovered = true"
    @mouseleave.self="isHovered = false"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Hover outline -->
    <div
      v-if="isHovered && !isSelected && !isBody"
      class="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
      :class="isComponentInstance ? 'ring-1 ring-green-fg/50' : isDynamic ? 'ring-1 ring-purple-fg/50' : 'ring-1 ring-primary/50'"
    />

    <!-- Hover label -->
    <div
      v-if="isHovered && !isSelected && !isBody"
      class="pointer-events-none absolute -top-5 left-0 z-20 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono leading-none text-white"
      :class="isComponentInstance ? 'bg-green-fg' : isDynamic ? 'bg-purple-fg' : 'bg-primary'"
    >
      <!-- Component icon -->
      <svg v-if="isComponentInstance" class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
      </svg>
      <!-- Dynamic field icon -->
      <svg v-else-if="isDynamic" class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
        <path d="M7.768 15.768a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 0 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3Z" />
      </svg>
      {{ node.label }}
    </div>
    <!-- Drop indicator: before (not for body) -->
    <div
      v-if="!isBody && dropPosition === 'before'"
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
      v-text="store.getNodeContent(node)"
    />

    <!-- Container / Body: render children -->
    <template v-else-if="isContainer">
      <!-- Collection List indicator -->
      <div v-if="node.type === 'collection-list'" class="flex items-center gap-1.5 px-2 py-1 mb-1 rounded-lg bg-amber-bg/50 text-[10px] font-mono text-amber-fg">
        <span>&#8634;</span>
        <span>{{ node.props.source ?? 'posts' }}</span>
        <span class="text-amber-fg/50">&#183; {{ node.props.limit ?? '3' }} items</span>
      </div>

      <!-- Collection Item indicator -->
      <div v-if="node.type === 'collection-item'" class="flex items-center gap-1 px-2 py-0.5 mb-1 rounded bg-amber-bg/30 text-[9px] font-mono text-amber-fg/70">
        Repeating item
      </div>

      <CanvasNodeRenderer
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="(depth ?? 0) + 1"
      />

      <!-- Empty state -->
      <div
        v-if="node.children.length === 0"
        :class="[
          'flex items-center justify-center text-xs text-secondary',
          isBody ? 'py-32' : 'border border-dashed rounded-xl py-8',
        ]"
      >
        {{ isBody ? 'Drag components from the sidebar to start building' : 'Drop elements here' }}
      </div>
    </template>

    <!-- Image placeholder -->
    <div
      v-else-if="node.type === 'image'"
      class="flex items-center justify-center bg-secondary/5 rounded-xl py-12 text-xs text-secondary"
    >
      Image placeholder
    </div>

    <!-- Video / Embed placeholder -->
    <div
      v-else-if="isMediaPlaceholder"
      class="flex items-center justify-center bg-secondary/5 rounded-xl py-10 text-xs text-secondary gap-2"
    >
      <span class="text-lg">{{ node.type === 'video' ? '&#9654;' : '&lt;/&gt;' }}</span>
      {{ node.type === 'video' ? 'Video' : 'Embed' }} placeholder
    </div>

    <!-- Form elements -->
    <div v-else-if="isFormElement" class="form-element-preview">
      <!-- Input -->
      <div v-if="node.type === 'input'" class="h-10 rounded-lg border border-foreground/15 bg-background px-3 flex items-center text-xs text-secondary">
        Text input
      </div>
      <!-- Textarea -->
      <div v-else-if="node.type === 'textarea'" class="h-24 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-secondary">
        Textarea
      </div>
      <!-- Select -->
      <div v-else-if="node.type === 'select'" class="h-10 rounded-lg border border-foreground/15 bg-background px-3 flex items-center justify-between text-xs text-secondary">
        <span>Select option</span>
        <span>&#9662;</span>
      </div>
      <!-- Checkbox -->
      <div v-else-if="node.type === 'checkbox'" class="flex items-center gap-2">
        <div class="size-4 rounded border border-foreground/20 bg-background" />
        <span class="text-xs text-secondary">Checkbox</span>
      </div>
      <!-- Radio -->
      <div v-else-if="node.type === 'radio'" class="flex items-center gap-2">
        <div class="size-4 rounded-full border border-foreground/20 bg-background" />
        <span class="text-xs text-secondary">Radio option</span>
      </div>
      <!-- File upload -->
      <div v-else-if="node.type === 'file-upload'" class="flex items-center gap-2 rounded-lg border border-dashed border-foreground/15 bg-secondary/5 px-3 py-3 text-xs text-secondary">
        <span>&#8679;</span> Choose file or drag here
      </div>
    </div>

    <!-- Drop indicator: after (not for body) -->
    <div
      v-if="!isBody && dropPosition === 'after'"
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
