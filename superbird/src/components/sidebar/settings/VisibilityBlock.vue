<script setup lang="ts">
import type { NodeVisibility } from '@/types/canvas'
import { useNodeSettings } from './useNodeSettings'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const { store, node, hasFields, schemaFields } = useNodeSettings()

const conditionOperatorOptions = [
  { value: '', label: 'None' },
  { value: 'exists', label: 'Field exists' },
  { value: 'not_exists', label: 'Field is empty' },
  { value: 'equals', label: 'Field equals' },
  { value: 'not_equals', label: 'Field not equals' },
]

function updateVisibility(partial: Partial<NodeVisibility>) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, {
    visibility: { ...(node.value.visibility ?? {}), ...partial },
  })
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Visibility" icon="effects" :default-open="false">
    <div class="space-y-2">
      <!-- Breakpoint toggles -->
      <div class="space-y-1.5">
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-xs text-foreground">Hide on Desktop</span>
          <ToggleUi
            :model-value="node.visibility?.hideDesktop ?? false"
            @update:model-value="updateVisibility({ hideDesktop: $event })"
          />
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-xs text-foreground">Hide on Tablet</span>
          <ToggleUi
            :model-value="node.visibility?.hideTablet ?? false"
            @update:model-value="updateVisibility({ hideTablet: $event })"
          />
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-xs text-foreground">Hide on Mobile</span>
          <ToggleUi
            :model-value="node.visibility?.hideMobile ?? false"
            @update:model-value="updateVisibility({ hideMobile: $event })"
          />
        </label>
      </div>

      <!-- Conditional logic -->
      <div v-if="hasFields" class="space-y-1.5 pt-1">
        <span class="text-[10px] text-secondary">Conditional Logic</span>
        <DropdownUi
          class="w-full"
          :model-value="node.visibility?.condition?.operator ?? ''"
          :options="conditionOperatorOptions"
          @update:model-value="(v: string) => updateVisibility({
            condition: v ? { field: node?.visibility?.condition?.field ?? '', operator: v as any, value: node?.visibility?.condition?.value } : undefined
          })"
        />
        <template v-if="node.visibility?.condition?.operator">
          <DropdownUi
            class="w-full"
            :model-value="node.visibility?.condition?.field ?? ''"
            :options="[
              { value: '', label: 'Select field...' },
              ...schemaFields.map((f) => ({ value: f.key, label: f.label })),
            ]"
            @update:model-value="(v: string) => updateVisibility({
              condition: { ...node!.visibility!.condition!, field: v }
            })"
          />
          <InputUi
            v-if="node.visibility?.condition?.operator === 'equals' || node.visibility?.condition?.operator === 'not_equals'"
            :model-value="node.visibility?.condition?.value ?? ''"
            placeholder="Value"
            @update:model-value="(v: string) => updateVisibility({
              condition: { ...node!.visibility!.condition!, value: v }
            })"
          />
        </template>
      </div>
    </div>
  </PropertySectionUi>
</template>
