<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import type { FieldType, NodeType } from '@/types/canvas'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { buildElementActions } from '@/composables/useNodeContextMenu'

const store = useCanvasStore()
const ctx = useContextMenu()

// Dynamic fields — only when editing a collection template. Dragging one
// creates a new field on the collection and places its bound element.
interface FieldDef { type: FieldType; label: string; glyph: string }
const dynamicFields: FieldDef[] = [
  { type: 'text', label: 'Text', glyph: 'T' },
  { type: 'richtext', label: 'Rich text', glyph: '¶' },
  { type: 'image', label: 'Image', glyph: '▦' },
  { type: 'number', label: 'Number', glyph: '#' },
  { type: 'date', label: 'Date', glyph: '📅' },
]

function handleFieldDragStart(e: DragEvent, type: FieldType) {
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('application/superbird-dynamic-field', type)
}

interface ElementDef { type: NodeType; label: string; icon: string }
interface ElementCategory { label: string; elements: ElementDef[] }

const categories: ElementCategory[] = [
  {
    label: 'Layout',
    elements: [
      { type: 'section', label: 'Section', icon: 'section' },
      { type: 'container', label: 'Container', icon: 'container' },
      { type: 'div', label: 'Div', icon: 'container' },
    ],
  },
  {
    label: 'Typography',
    elements: [
      { type: 'heading', label: 'Heading', icon: 'heading' },
      { type: 'text', label: 'Text', icon: 'text' },
      { type: 'markdown', label: 'Markdown', icon: 'markdown' },
      { type: 'link', label: 'Link', icon: 'link' },
      { type: 'span', label: 'Span', icon: 'span' },
      { type: 'list', label: 'List', icon: 'list' },
      { type: 'blockquote', label: 'Quote', icon: 'blockquote' },
    ],
  },
  {
    label: 'Media',
    elements: [
      { type: 'image', label: 'Image', icon: 'image' },
      { type: 'video', label: 'Video', icon: 'video' },
      { type: 'embed', label: 'Embed', icon: 'embed' },
    ],
  },
  {
    label: 'Form',
    elements: [
      { type: 'form', label: 'Form', icon: 'form' },
      { type: 'input', label: 'Input', icon: 'input' },
      { type: 'textarea', label: 'Textarea', icon: 'textarea' },
      { type: 'select', label: 'Select', icon: 'select' },
      { type: 'checkbox', label: 'Checkbox', icon: 'checkbox' },
      { type: 'radio', label: 'Radio', icon: 'radio' },
      { type: 'label', label: 'Label', icon: 'label' },
      { type: 'file-upload', label: 'Upload', icon: 'upload' },
    ],
  },
  {
    label: 'Interactive',
    elements: [
      { type: 'button', label: 'Button', icon: 'button' },
      { type: 'link-block', label: 'Link Block', icon: 'link-block' },
    ],
  },
  {
    label: 'Data',
    elements: [
      { type: 'collection-list', label: 'Collection', icon: 'collection' },
    ],
  },
]

function handleDragStart(e: DragEvent, type: NodeType) {
  e.dataTransfer!.effectAllowed = 'copyMove'
  e.dataTransfer!.setData('application/superbird-component', type)
  store.setDraggedComponent(type)
}

function handleDragEnd() {
  store.setDraggedComponent(null)
}

function handleContextMenu(e: MouseEvent, type: NodeType) {
  ctx.open(e, buildElementActions(type))
}
</script>

<template>
  <div class="p-4 space-y-6">
    <!-- Dynamic fields (collection templates only) -->
    <div v-if="store.isCollectionTemplate">
      <div class="px-1 pb-1 pt-0.5 text-[9px] font-mono uppercase tracking-wider text-purple-fg/70">Dynamic Fields</div>
      <div class="grid grid-cols-4 gap-0.5">
        <div
          v-for="f in dynamicFields"
          :key="f.type"
          class="flex cursor-grab flex-col items-center gap-1 rounded-lg py-1.5 text-foreground transition-colors duration-150 hover:bg-purple-bg/40 active:cursor-grabbing"
          draggable="true"
          @dragstart="handleFieldDragStart($event, f.type)"
        >
          <span class="flex size-7 items-center justify-center rounded-md bg-purple-bg text-purple-fg"><IconUi :name="f.type" size="size-4" /></span>
          <span class="text-[9px]">{{ f.label }}</span>
        </div>
      </div>
    </div>

    <div v-for="cat in categories" :key="cat.label" class="space-y-2">
      <div class="text-xs font-medium">{{ cat.label }}</div>
      <div class="grid grid-cols-4 gap-0.5">
        <div
          v-for="el in cat.elements"
          :key="el.type"
          class="flex cursor-grab flex-col items-center gap-1 rounded-lg py-1.5 text-foreground active:cursor-grabbing"
          draggable="true"
          @dragstart="handleDragStart($event, el.type)"
          @dragend="handleDragEnd"
          @contextmenu.prevent="handleContextMenu($event, el.type)"
        >
          <span class="flex size-12 items-center justify-center rounded-md bg-foreground/5 text-secondary">
            <IconUi :name="el.icon" size="size-5" />
          </span>
          <span class="text-[9px] font-mono uppercase tracking-wider">{{ el.label }}</span>
        </div>
      </div>
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
