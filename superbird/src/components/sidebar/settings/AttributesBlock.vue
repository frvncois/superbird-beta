<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const newAttrKey = ref('')
const newAttrValue = ref('')

function updateHtmlId(value: string) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, { htmlId: value || undefined })
}

function updateAriaLabel(value: string) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, {
    accessibility: { ...(node.value.accessibility ?? {}), ariaLabel: value || undefined },
  })
}

function addCustomAttribute() {
  if (!node.value || !newAttrKey.value.trim()) return
  store.setCustomAttribute(node.value.id, newAttrKey.value.trim(), newAttrValue.value)
  newAttrKey.value = ''
  newAttrValue.value = ''
}

function removeCustomAttribute(key: string) {
  if (!node.value) return
  store.removeCustomAttribute(node.value.id, key)
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Attributes" icon="settings" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="ID" label-width="sm">
        <InputUi
          :model-value="node.htmlId ?? ''"
          placeholder="element-id"
          @update:model-value="updateHtmlId"
        />
      </FieldRowUi>
      <FieldRowUi label="Aria label" label-width="sm">
        <InputUi
          :model-value="node.accessibility?.ariaLabel ?? ''"
          placeholder="Accessible label"
          @update:model-value="updateAriaLabel"
        />
      </FieldRowUi>

      <!-- Custom key/value attributes -->
      <div class="pt-1.5">
        <span class="text-[10px] text-secondary">Custom Attributes</span>
        <!-- Existing attributes -->
        <div v-if="node.customAttributes" class="space-y-1 mt-1">
          <div
            v-for="(val, key) in node.customAttributes"
            :key="key"
            class="flex items-center gap-1"
          >
            <span class="flex-1 truncate rounded-lg bg-secondary/8 px-2 py-1 text-[10px] font-mono">
              {{ key }}="{{ val }}"
            </span>
            <IconButtonUi size="sm" variant="danger" @click="removeCustomAttribute(key as string)">
              <IconUi name="close" size="size-3" />
            </IconButtonUi>
          </div>
        </div>
        <!-- Add new -->
        <div class="mt-1 space-y-1">
          <InputUi v-model="newAttrKey" size="xs" placeholder="key" />
          <div class="flex items-center gap-1">
            <InputUi
              v-model="newAttrValue"
              size="xs"
              placeholder="value"
              class="min-w-0 flex-1"
              @keydown.enter="addCustomAttribute"
            />
            <ButtonUi size="sm" class="shrink-0" @click="addCustomAttribute">
              <IconUi name="plus" size="size-3" />
              Add
            </ButtonUi>
          </div>
        </div>
      </div>
    </div>
  </PropertySectionUi>
</template>
