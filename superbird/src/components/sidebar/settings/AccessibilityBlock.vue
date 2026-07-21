<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { NodeAccessibility } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)
const isImage = computed(() => node.value?.type === 'image')

const roleOptions = [
  { value: '', label: 'None' },
  { value: 'banner', label: 'Banner' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'main', label: 'Main' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'contentinfo', label: 'Content Info' },
  { value: 'search', label: 'Search' },
  { value: 'form', label: 'Form' },
  { value: 'region', label: 'Region' },
  { value: 'alert', label: 'Alert' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'tablist', label: 'Tab List' },
  { value: 'tab', label: 'Tab' },
  { value: 'tabpanel', label: 'Tab Panel' },
  { value: 'button', label: 'Button' },
  { value: 'presentation', label: 'Presentation' },
]

function updateAccessibility(partial: Partial<NodeAccessibility>) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, {
    accessibility: { ...(node.value.accessibility ?? {}), ...partial },
  })
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Accessibility" icon="settings" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Role" label-width="sm">
        <SelectUi
          :model-value="node.accessibility?.role ?? ''"
          :options="roleOptions"
          @update:model-value="updateAccessibility({ role: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi label="Label" label-width="sm">
        <InputUi
          :model-value="node.accessibility?.ariaLabel ?? ''"
          placeholder="Accessible label"
          @update:model-value="updateAccessibility({ ariaLabel: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi v-if="isImage" label="Alt" label-width="sm">
        <InputUi
          :model-value="node.accessibility?.altText ?? ''"
          placeholder="Image description"
          @update:model-value="updateAccessibility({ altText: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi label="Tab" label-width="sm">
        <InputUi
          :model-value="node.accessibility?.tabIndex !== undefined ? String(node.accessibility.tabIndex) : ''"
          placeholder="0"
          @update:model-value="updateAccessibility({ tabIndex: $event ? Number($event) : undefined })"
        />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
