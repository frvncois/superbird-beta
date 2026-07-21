<script setup lang="ts">
import type { CollectionField } from '@/types/canvas'
import LabelUi from '@/components/ui/LabelUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

defineProps<{
  field: CollectionField
}>()
</script>

<template>
  <section class="space-y-2 pb-3">
    <LabelUi>Dynamic Field</LabelUi>
    <div class="flex items-center gap-2 rounded-xl bg-purple-bg/40 px-3 py-2">
      <IconUi name="link" size="size-3.5" class="text-purple-fg" />
      <span class="flex-1 text-xs font-medium text-foreground">{{ field.label }}</span>
      <span class="rounded bg-purple-bg px-1.5 py-px text-[9px] font-mono uppercase text-purple-fg">{{ field.type }}</span>
    </div>
    <p class="px-1 text-[10px] leading-relaxed text-secondary">
      Its content is filled per item. Rename it via the Label above; delete the element to remove the field.
    </p>
  </section>
</template>
