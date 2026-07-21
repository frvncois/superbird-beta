<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { NodeLink } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const targetOptions = [
  { value: '_self', label: 'Same tab' },
  { value: '_blank', label: 'New tab' },
]

function updateLink(partial: Partial<NodeLink>) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, {
    link: { ...(node.value.link ?? {}), ...partial },
  })
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Link" icon="settings" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="URL" label-width="sm">
        <InputUi
          :model-value="node.link?.url ?? ''"
          placeholder="https://..."
          @update:model-value="updateLink({ url: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi label="Target" label-width="sm">
        <SelectUi
          :model-value="node.link?.target ?? '_self'"
          :options="targetOptions"
          @update:model-value="updateLink({ target: $event as '_self' | '_blank' })"
        />
      </FieldRowUi>
      <FieldRowUi label="Rel" label-width="sm">
        <InputUi
          :model-value="node.link?.rel ?? ''"
          placeholder="nofollow noopener"
          @update:model-value="updateLink({ rel: $event || undefined })"
        />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
