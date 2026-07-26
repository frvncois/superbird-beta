<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useLocalesStore } from '@/stores/locales'
import type { NodeType, PrebuiltElementKey } from '@/types/canvas'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import { useContextMenu } from '@/composables/useContextMenu'
import { buildElementActions } from '@/composables/useNodeContextMenu'

const store = useCanvasStore()
const localesStore = useLocalesStore()
const ctx = useContextMenu()

// `prebuilt` marks a ready-made "System" element (lang) — dragged with a
// different MIME so the drop inserts a whole tree instead of a single node.
// `requires` gates an element on a site capability being on (multilang).
interface ElementDef { type: NodeType; label: string; icon: string; prebuilt?: PrebuiltElementKey; requires?: 'multilang' }
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
    label: 'Content',
    elements: [
      { type: 'heading', label: 'Heading', icon: 'heading' },
      { type: 'text', label: 'Text', icon: 'text' },
      { type: 'markdown', label: 'Markdown', icon: 'markdown' },
      { type: 'link', label: 'Link', icon: 'link' },
      { type: 'span', label: 'Span', icon: 'span' },
      { type: 'list', label: 'List', icon: 'list' },
      { type: 'blockquote', label: 'Blockquote', icon: 'blockquote' },
      { type: 'image', label: 'Image', icon: 'image' },
      { type: 'video', label: 'Video', icon: 'video' },
      { type: 'embed', label: 'Embed', icon: 'embed' },
    ],
  },
  {
    label: 'Forms',
    elements: [
      { type: 'form', label: 'Form', icon: 'form' },
      { type: 'input', label: 'Input', icon: 'input' },
      { type: 'textarea', label: 'Textarea', icon: 'textarea' },
      { type: 'select', label: 'Select', icon: 'select' },
      { type: 'checkbox', label: 'Checkbox', icon: 'checkbox' },
      { type: 'radio', label: 'Radio', icon: 'radio' },
      { type: 'label', label: 'Label', icon: 'label' },
      { type: 'file-upload', label: 'File Upload', icon: 'upload' },
    ],
  },
  {
    label: 'Interactive',
    elements: [
      { type: 'button', label: 'Button', icon: 'button' },
      { type: 'link-block', label: 'Link Container', icon: 'link-block' },
      { type: 'collection-list', label: 'Collection List', icon: 'collection' },
    ],
  },
  {
    label: 'System',
    elements: [
      { type: 'div', label: 'Lang Switcher', icon: 'globe', prebuilt: 'lang-switcher', requires: 'multilang' },
    ],
  },
]

// Multilang on ⇔ more than the default locale is configured.
const multilangEnabled = computed(() => localesStore.locales.length > 1)

function isAvailable(el: ElementDef): boolean {
  if (el.requires === 'multilang') return multilangEnabled.value
  return true
}

// ── Search / filter ──
const query = ref('')
const q = computed(() => query.value.trim().toLowerCase())

const filteredCategories = computed(() =>
  categories
    .map((cat) => ({
      ...cat,
      elements: cat.elements.filter((el) => isAvailable(el) && (!q.value || el.label.toLowerCase().includes(q.value))),
    }))
    .filter((cat) => cat.elements.length > 0),
)

const hasResults = computed(() => filteredCategories.value.length > 0)

function handleDragStart(e: DragEvent, el: ElementDef) {
  e.dataTransfer!.effectAllowed = 'copyMove'
  if (el.prebuilt) {
    e.dataTransfer!.setData('application/superbird-prebuilt', el.prebuilt)
  } else {
    e.dataTransfer!.setData('application/superbird-component', el.type)
    store.setDraggedComponent(el.type)
  }
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
    <InputUi v-model="query" type="search" placeholder="Search elements…" />

    <div v-for="cat in filteredCategories" :key="cat.label" class="space-y-2">
      <LabelUi size="xs">{{ cat.label }}</LabelUi>
      <div class="grid grid-cols-4 gap-0.5">
        <ButtonUi
          v-for="el in cat.elements"
          :key="el.type"
          variant="bare"
          draggable="true"
          class="w-full flex-col rounded-lg py-1.5 !cursor-grab active:!cursor-grabbing"
          @dragstart="handleDragStart($event, el)"
          @dragend="handleDragEnd"
          @contextmenu.prevent="handleContextMenu($event, el.type)"
        >
          <span class="flex size-12 items-center justify-center rounded-md bg-foreground/5 text-secondary">
            <IconUi :name="el.icon" size="size-5" />
          </span>
          <LabelUi size="xs" class="text-foreground">{{ el.label }}</LabelUi>
        </ButtonUi>
      </div>
    </div>

    <EmptyStateUi v-if="!hasResults" :message="`No elements match “${query}”`" compact />

    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />
  </div>
</template>
