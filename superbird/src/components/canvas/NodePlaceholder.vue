<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasNode } from '@/types/canvas'

const props = defineProps<{
  node: CanvasNode
}>()

const isMediaPlaceholder = computed(() => ['video', 'embed'].includes(props.node.type))
const isFormElement = computed(() => ['input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload'].includes(props.node.type))
</script>

<template>
  <!-- Image placeholder -->
  <div
    v-if="node.type === 'image'"
    class="flex items-center justify-center bg-secondary/5 rounded-xl py-12 text-xs text-secondary"
  >
    Image placeholder
  </div>

  <!-- Video / Embed placeholder -->
  <div
    v-else-if="isMediaPlaceholder"
    class="flex items-center justify-center bg-secondary/5 rounded-xl py-10 text-xs text-secondary gap-2"
  >
    <span class="text-lg">{{ node.type === 'video' ? '&#9654;' : '&lt;/&gt;' }}</span>
    {{ node.type === 'video' ? 'Video' : 'Embed' }} placeholder
  </div>

  <!-- Form elements -->
  <div v-else-if="isFormElement" class="form-element-preview">
    <!-- Input -->
    <div v-if="node.type === 'input'" class="h-10 rounded-lg border border-foreground/15 bg-background px-3 flex items-center text-xs text-secondary">
      Text input
    </div>
    <!-- Textarea -->
    <div v-else-if="node.type === 'textarea'" class="h-24 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-secondary">
      Textarea
    </div>
    <!-- Select -->
    <div v-else-if="node.type === 'select'" class="h-10 rounded-lg border border-foreground/15 bg-background px-3 flex items-center justify-between text-xs text-secondary">
      <span>Select option</span>
      <span>&#9662;</span>
    </div>
    <!-- Checkbox -->
    <div v-else-if="node.type === 'checkbox'" class="flex items-center gap-2">
      <div class="size-4 rounded border border-foreground/20 bg-background" />
      <span class="text-xs text-secondary">Checkbox</span>
    </div>
    <!-- Radio -->
    <div v-else-if="node.type === 'radio'" class="flex items-center gap-2">
      <div class="size-4 rounded-full border border-foreground/20 bg-background" />
      <span class="text-xs text-secondary">Radio option</span>
    </div>
    <!-- File upload -->
    <div v-else-if="node.type === 'file-upload'" class="flex items-center gap-2 rounded-lg border border-dashed border-foreground/15 bg-secondary/5 px-3 py-3 text-xs text-secondary">
      <span>&#8679;</span> Choose file or drag here
    </div>
  </div>
</template>
