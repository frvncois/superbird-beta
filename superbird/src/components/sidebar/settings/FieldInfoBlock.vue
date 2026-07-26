<script setup lang="ts">
import type { CollectionField } from '@/types/canvas'
import IconUi from '@/components/ui/IconUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

defineProps<{
  field: CollectionField
}>()
</script>

<template>
  <PropertySectionUi title="Dynamic Field" icon="settings">
    <div class="space-y-2">
      <div class="flex items-center gap-2 rounded-xl bg-purple-bg/40 px-3 py-2">
        <IconUi name="link" size="size-3.5" class="text-purple-fg" />
        <span class="flex-1 text-xs font-medium text-foreground">{{ field.label }}</span>
        <span class="rounded bg-purple-bg px-1.5 py-px text-[9px] font-mono uppercase text-purple-fg">{{ field.type }}</span>
      </div>
      <p class="px-1 text-[10px] leading-relaxed text-secondary">
        Its content is filled per item. Rename it via the Label above; delete the element to remove the field.
      </p>
    </div>
  </PropertySectionUi>
</template>
