<script setup lang="ts">
import { ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import { formatFileSize } from '@/lib/media'
import type { MediaItem } from '@/types/canvas'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  items: MediaItem[]
  activeFolder?: string
}>()

const selectedId = defineModel<string | null>('selectedId', { required: true })

const store = useMediaStore()

const isDragOver = ref(false)

function handleFilesDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (!files) return
  for (const file of files) {
    const item = store.addMediaItem(file)
    if (props.activeFolder) store.moveMediaToFolder(item.id, props.activeFolder)
  }
}

function onItemClick(item: MediaItem) {
  if (store.isPicking) {
    store.pick(item)
    return
  }
  selectedId.value = selectedId.value === item.id ? null : item.id
}
</script>

<template>
  <div
    :class="['flex-1 overflow-y-auto p-4', isDragOver && 'bg-primary/5']"
    @dragover.prevent="isDragOver = true"
    @dragleave.self="isDragOver = false"
    @drop="handleFilesDrop"
  >
    <EmptyStateUi v-if="items.length === 0 && !isDragOver" class="h-full">
      <IconUi name="upload" size="size-12" class="text-secondary/30" />
      <p class="text-sm">Drop files here or click Upload</p>
    </EmptyStateUi>

    <EmptyStateUi v-else-if="isDragOver" class="h-full">
      <IconUi name="upload" size="size-12" class="text-primary" />
      <p class="text-sm font-medium text-primary">Drop files to upload</p>
    </EmptyStateUi>

    <div v-else class="grid grid-cols-4 gap-3">
      <div
        v-for="item in items"
        :key="item.id"
        :class="[
          'group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-100',
          selectedId === item.id ? 'ring-2 ring-primary border-primary' : 'border-foreground/10 hover:border-foreground/20',
          store.isPicking && 'hover:ring-2 hover:ring-primary/50',
        ]"
        @click="onItemClick(item)"
      >
        <!-- Thumbnail -->
        <div class="aspect-square bg-secondary/5 flex items-center justify-center">
          <img v-if="item.type === 'image' && item.url" :src="item.url" :alt="item.alt ?? item.name" class="w-full h-full object-cover" />
          <IconUi v-else-if="item.type === 'image'" name="image" size="size-8" class="text-secondary/30" />
          <IconUi v-else name="document" size="size-8" class="text-secondary/30" />
        </div>

        <!-- Info -->
        <div class="px-2 py-1.5">
          <div class="text-[10px] font-medium truncate">{{ item.name }}</div>
          <div class="text-[9px] text-secondary">{{ formatFileSize(item.size) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
