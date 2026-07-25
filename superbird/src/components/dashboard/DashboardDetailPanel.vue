<script setup lang="ts">
import IconUi from '@/components/ui/IconUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

defineProps<{ icon: string; title: string }>()
const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header: icon + title + contextual action -->
    <div class="flex items-center gap-2.5 border-b px-3 py-3">
      <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
        <IconUi :name="icon" size="size-3.5" />
      </span>
      <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{{ title }}</p>
      <div class="shrink-0"><slot name="action" /></div>
    </div>

    <!-- Back -->
    <ButtonUi variant="ghost" size="sm" align="start" @click="emit('back')">
      <IconUi name="chevron-right" size="size-3" class="rotate-180" />
      Back to dashboard
    </ButtonUi>

    <!-- Content -->
    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <slot />
    </div>
  </div>
</template>
