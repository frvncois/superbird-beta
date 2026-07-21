<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { COLLECTION_SOURCES } from '@/constants/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const collectionSourceOptions = COLLECTION_SOURCES.map((s) => ({ value: s.key, label: s.label }))
const collectionOrderByOptions = [
  { value: 'date', label: 'Date' },
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'random', label: 'Random' },
]
const collectionOrderOptions = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
]

function updatePropValue(key: string, value: string) {
  if (!node.value) return
  const props = { ...node.value.props, [key]: value }
  store.updateNode(node.value.id, { props })
}
</script>

<template>
  <section v-if="node" class="space-y-2 pb-3">
    <LabelUi>Collection</LabelUi>
    <div class="space-y-1.5">
      <FieldRowUi label="Source" label-width="md">
        <SelectUi
          :model-value="node.props.source ?? 'posts'"
          :options="collectionSourceOptions"
          @update:model-value="updatePropValue('source', $event)"
        />
      </FieldRowUi>
      <FieldRowUi label="Limit" label-width="md">
        <InputUi
          :model-value="node.props.limit ?? '3'"
          placeholder="3"
          @update:model-value="updatePropValue('limit', $event)"
        />
      </FieldRowUi>
      <FieldRowUi label="Order by" label-width="md">
        <SelectUi
          :model-value="node.props.orderBy ?? 'date'"
          :options="collectionOrderByOptions"
          @update:model-value="updatePropValue('orderBy', $event)"
        />
      </FieldRowUi>
      <FieldRowUi label="Order" label-width="md">
        <SelectUi
          :model-value="node.props.order ?? 'desc'"
          :options="collectionOrderOptions"
          @update:model-value="updatePropValue('order', $event)"
        />
      </FieldRowUi>
    </div>
  </section>
</template>
