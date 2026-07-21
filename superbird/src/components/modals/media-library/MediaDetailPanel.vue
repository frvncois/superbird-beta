<script setup lang="ts">
import { computed } from 'vue'
import { useMediaStore } from '@/stores/media'
import { formatFileSize } from '@/lib/media'
import type { MediaItem } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  deleted: []
}>()

const store = useMediaStore()

const folderOptions = computed(() => [
  { value: '', label: 'Uncategorized' },
  ...store.mediaFolders.map((f) => ({ value: f.id, label: f.name })),
])

function deleteItem() {
  store.removeMediaItem(props.item.id)
  emit('deleted')
}
</script>

<template>
  <div class="w-56 shrink-0 border-l flex flex-col">
    <div class="p-3 border-b">
      <span class="text-xs font-semibold">Details</span>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <!-- Preview -->
      <div class="aspect-square rounded-lg bg-secondary/5 flex items-center justify-center overflow-hidden">
        <img v-if="item.type === 'image' && item.url" :src="item.url" class="w-full h-full object-contain" />
        <span v-else class="text-xs text-secondary font-mono">{{ item.mimeType }}</span>
      </div>

      <!-- Info -->
      <div class="space-y-1.5">
        <div class="space-y-0.5">
          <LabelUi size="xs">Name</LabelUi>
          <InputUi
            size="xs"
            :model-value="item.name"
            @update:model-value="store.updateMediaItem(item.id, { name: $event })"
          />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Alt Text</LabelUi>
          <InputUi
            size="xs"
            :model-value="item.alt ?? ''"
            placeholder="Describe the image"
            @update:model-value="store.updateMediaItem(item.id, { alt: $event || undefined })"
          />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Folder</LabelUi>
          <SelectUi
            :model-value="item.folderId ?? ''"
            :options="folderOptions"
            @update:model-value="store.moveMediaToFolder(item.id, $event || undefined)"
          />
        </div>
        <div class="flex items-center justify-between text-[10px] text-secondary pt-1">
          <span>{{ formatFileSize(item.size) }}</span>
          <span v-if="item.width">{{ item.width }} x {{ item.height }}</span>
        </div>
        <div class="text-[10px] text-secondary">{{ item.createdAt }}</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-3 border-t">
      <ButtonUi variant="danger" size="sm" class="w-full text-[10px]" @click="deleteItem">
        Delete
      </ButtonUi>
    </div>
  </div>
</template>
