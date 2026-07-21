<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import type { MediaType } from '@/types/canvas'
import ModalUi from '@/components/ui/ModalUi.vue'
import MediaFolderList from './MediaFolderList.vue'
import MediaToolbar from './MediaToolbar.vue'
import MediaGrid from './MediaGrid.vue'
import MediaDetailPanel from './MediaDetailPanel.vue'

const store = useMediaStore()

const searchQuery = ref('')
const activeFolder = ref<string | undefined>(undefined)
const filterType = ref<MediaType | 'all'>('all')
const selectedItem = ref<string | null>(null)

const libraryOpen = computed({
  get: () => store.mediaLibraryOpen,
  set: (value) => {
    if (value) store.openLibrary()
    else store.closeLibrary()
  },
})

const filteredItems = computed(() => {
  let items = store.mediaItems

  // Folder filter
  if (activeFolder.value) {
    items = items.filter((m) => m.folderId === activeFolder.value)
  } else {
    // Root: show items without folder
    items = items.filter((m) => !m.folderId)
  }

  // Type filter
  if (filterType.value !== 'all') {
    items = items.filter((m) => m.type === filterType.value)
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((m) =>
      m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }

  return items
})

const selectedMedia = computed(() =>
  store.mediaItems.find((m) => m.id === selectedItem.value),
)
</script>

<template>
  <ModalUi v-model:open="libraryOpen" panel-class="w-full max-w-5xl h-full max-h-[80vh]">
    <div class="flex flex-1 min-h-0">
      <MediaFolderList v-model:active-folder="activeFolder" />

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <MediaToolbar
          v-model:search="searchQuery"
          v-model:filter-type="filterType"
          :active-folder="activeFolder"
          @close="libraryOpen = false"
        />

        <MediaGrid
          v-model:selected-id="selectedItem"
          :items="filteredItems"
          :active-folder="activeFolder"
        />
      </div>

      <!-- Detail panel (when item selected) -->
      <MediaDetailPanel
        v-if="selectedMedia"
        :item="selectedMedia"
        @deleted="selectedItem = null"
      />
    </div>
  </ModalUi>
</template>
