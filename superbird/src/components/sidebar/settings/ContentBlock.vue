<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useLocalesStore } from '@/stores/locales'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const localesStore = useLocalesStore()
const node = computed(() => store.selectedNode)

const nodeContent = computed(() => {
  if (!node.value) return ''
  return store.getNodeContent(node.value)
})

function updateContent(value: string) {
  if (!node.value) return
  store.setNodeContent(node.value.id, value)
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Content" icon="settings">
    <div class="space-y-1.5">
      <div v-if="!localesStore.isDefaultLocale" class="flex justify-end">
        <span class="text-[9px] font-mono font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded">
          {{ localesStore.activeLocale.toUpperCase() }}
        </span>
      </div>
      <TextareaUi
        :model-value="nodeContent"
        placeholder="Text content"
        :rows="3"
        @update:model-value="updateContent"
      />
    </div>
  </PropertySectionUi>
</template>
