<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const tagOptions = computed(() => {
  if (!node.value) return []
  switch (node.value.type) {
    case 'heading':
      return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((v) => ({ value: v, label: v.toUpperCase() }))
    case 'text':
      return [
        { value: 'p', label: 'Paragraph' },
        { value: 'span', label: 'Span' },
        { value: 'blockquote', label: 'Blockquote' },
      ]
    case 'container':
    case 'section':
      return [
        { value: 'div', label: 'Div' },
        { value: 'section', label: 'Section' },
        { value: 'article', label: 'Article' },
        { value: 'aside', label: 'Aside' },
        { value: 'nav', label: 'Nav' },
        { value: 'header', label: 'Header' },
        { value: 'footer', label: 'Footer' },
      ]
    default:
      return []
  }
})

function updateLabel(value: string) {
  if (!node.value) return
  store.updateNode(node.value.id, { label: value })
}

function updateTag(value: string) {
  if (!node.value) return
  store.updateNode(node.value.id, { tag: value })
}
</script>

<template>
  <section v-if="node" class="space-y-2 pb-3">
    <LabelUi>Element</LabelUi>
    <div class="space-y-1.5">
      <InputUi
        :model-value="node.label"
        placeholder="Label"
        @update:model-value="updateLabel"
      />
      <SelectUi
        v-if="tagOptions.length > 0"
        :model-value="node.tag"
        :options="tagOptions"
        @update:model-value="updateTag"
      />
    </div>
  </section>
</template>
