<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { NodeAdvanced } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

function updateAdvanced(partial: Partial<NodeAdvanced>) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, {
    advanced: { ...(node.value.advanced ?? {}), ...partial },
  })
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Advanced" icon="settings" :default-open="false">
    <div class="space-y-1.5">
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Custom CSS Classes</span>
        <InputUi
          :model-value="node.advanced?.customCssClass ?? ''"
          placeholder="my-class another-class"
          @update:model-value="updateAdvanced({ customCssClass: $event || undefined })"
        />
      </div>
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Code Before Element</span>
        <TextareaUi
          :model-value="node.advanced?.codeBefore ?? ''"
          placeholder="<!-- HTML or script -->"
          :rows="2"
          mono
          @update:model-value="updateAdvanced({ codeBefore: $event || undefined })"
        />
      </div>
      <div class="space-y-1">
        <span class="text-[10px] text-secondary">Code After Element</span>
        <TextareaUi
          :model-value="node.advanced?.codeAfter ?? ''"
          placeholder="<!-- HTML or script -->"
          :rows="2"
          mono
          @update:model-value="updateAdvanced({ codeAfter: $event || undefined })"
        />
      </div>
    </div>
  </PropertySectionUi>
</template>
