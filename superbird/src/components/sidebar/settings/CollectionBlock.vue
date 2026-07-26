<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()
const node = computed(() => store.selectedNode)

const collectionSourceOptions = computed(() => [
  { value: '', label: 'Select collection…' },
  ...collections.collections.map((c) => ({ value: c.id, label: c.name })),
])
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
  <PropertySectionUi v-if="node" title="Collection" icon="settings">
    <div class="space-y-1.5">
      <FieldRowUi label="Source" label-width="md">
        <DropdownUi
          class="w-full"
          :model-value="node.props.source ?? ''"
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
        <DropdownUi
          class="w-full"
          :model-value="node.props.orderBy ?? 'date'"
          :options="collectionOrderByOptions"
          @update:model-value="updatePropValue('orderBy', $event)"
        />
      </FieldRowUi>
      <FieldRowUi label="Order" label-width="md">
        <DropdownUi
          class="w-full"
          :model-value="node.props.order ?? 'desc'"
          :options="collectionOrderOptions"
          @update:model-value="updatePropValue('order', $event)"
        />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
