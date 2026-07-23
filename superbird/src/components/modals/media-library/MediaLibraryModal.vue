<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useDialog } from '@/composables/useDialog'
import type { MediaItem, MediaType } from '@/types/canvas'
import ModalUi from '@/components/ui/ModalUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import MediaBreadcrumb from './MediaBreadcrumb.vue'
import MediaGrid from './MediaGrid.vue'
import MediaDetailPanel from './MediaDetailPanel.vue'

const store = useMediaStore()
const dialog = useDialog()

const searchQuery = ref('')
const currentFolder = ref<string | undefined>(undefined)
const filterType = ref<MediaType | 'all'>('all')
const selectedItem = ref<string | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)

async function onUploadFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (const file of input.files) await store.addMediaItem(file, currentFolder.value)
  input.value = ''
}

// Type filter.
const typeFilterOptions = [
  { value: 'all', label: 'All types', icon: 'layers' },
  { value: 'image', label: 'Images', icon: 'image' },
  { value: 'video', label: 'Videos', icon: 'video' },
  { value: 'document', label: 'Documents', icon: 'document' },
  { value: 'audio', label: 'Audio', icon: 'audio' },
]
const filterTypeProxy = computed<string>({ get: () => filterType.value, set: (v) => (filterType.value = v as MediaType | 'all') })

// View + sort.
type SortKey = 'name' | 'date' | 'type' | 'weight'
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<SortKey>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const sortOptions = [
  { value: 'name', label: 'Name', icon: 'text' },
  { value: 'date', label: 'Upload date', icon: 'date' },
  { value: 'type', label: 'Type', icon: 'swatch' },
  { value: 'weight', label: 'Weight', icon: 'weight' },
]
const sortByProxy = computed<string>({ get: () => sortBy.value, set: (v) => (sortBy.value = v as SortKey) })
const viewModeProxy = computed<string>({ get: () => viewMode.value, set: (v) => (viewMode.value = v as 'grid' | 'list') })

const viewOptions = [
  { value: 'grid', label: 'Grid', title: 'Grid view' },
  { value: 'list', label: 'List', title: 'List view' },
]

function compareItems(a: MediaItem, b: MediaItem): number {
  let r = 0
  switch (sortBy.value) {
    case 'name': r = a.name.localeCompare(b.name); break
    case 'date': r = (a.createdAt ?? '').localeCompare(b.createdAt ?? ''); break
    case 'type': r = a.type.localeCompare(b.type) || a.name.localeCompare(b.name); break
    case 'weight': r = a.size - b.size; break
  }
  return sortDir.value === 'asc' ? r : -r
}

const libraryOpen = computed({
  get: () => store.mediaLibraryOpen,
  set: (value) => {
    if (value) store.openLibrary()
    else store.closeLibrary()
  },
})

const isSearching = computed(() => searchQuery.value.trim().length > 0)

// Subfolders of the folder we're viewing (sorted by name, honoring direction).
const foldersInView = computed(() => {
  let folders = store.mediaFolders.filter((f) => (f.parentId ?? undefined) === currentFolder.value)
  if (isSearching.value) {
    const q = searchQuery.value.toLowerCase()
    folders = folders.filter((f) => f.name.toLowerCase().includes(q))
  }
  const dir = sortBy.value === 'name' && sortDir.value === 'desc' ? -1 : 1
  return folders.slice().sort((a, b) => a.name.localeCompare(b.name) * dir)
})

// Files in the folder we're viewing, after type + search filters, then sorted.
const itemsInView = computed(() => {
  let items = store.mediaItems.filter((m) => (m.folderId ?? undefined) === currentFolder.value)
  if (filterType.value !== 'all') items = items.filter((m) => m.type === filterType.value)
  if (isSearching.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)))
  }
  return items.slice().sort(compareItems)
})

const selectedMedia = computed(() => store.mediaItems.find((m) => m.id === selectedItem.value))

function openFolder(id: string) {
  currentFolder.value = id
  selectedItem.value = null
}

function navigate(folderId: string | undefined) {
  currentFolder.value = folderId
  selectedItem.value = null
}

async function createFolder() {
  const name = await dialog.prompt({
    title: 'Create folder',
    placeholder: 'Folder name',
    confirmLabel: 'Create',
  })
  if (name) store.addMediaFolder(name, currentFolder.value)
}

// If the current folder disappears (deleted, or reset), fall back to root.
watch(
  () => store.mediaFolders,
  () => {
    if (currentFolder.value && !store.mediaFolders.some((f) => f.id === currentFolder.value)) {
      currentFolder.value = undefined
    }
  },
  { deep: true },
)
</script>

<template>
  <ModalUi v-model:open="libraryOpen" panel-class="w-full max-w-5xl h-full max-h-[80vh]">
    <div class="flex min-h-0 flex-1 flex-col">
      <!-- Row 1: title bar -->
      <div class="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div class="flex items-center gap-2">
          <IconUi name="image" size="size-4" class="text-secondary" />
          <span class="text-sm font-semibold">Media Library</span>
        </div>
        <IconButtonUi title="Close" @click="libraryOpen = false">
          <IconUi name="close" size="size-4" />
        </IconButtonUi>
      </div>

      <!-- Row 2: search · type · order by · grid/list -->
      <div class="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
        <div class="relative min-w-0 flex-1">
          <IconUi name="search" size="size-3.5" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
          <InputUi v-model="searchQuery" placeholder="Search files..." class="pl-8" />
        </div>

        <div class="w-32 shrink-0">
          <SelectUi v-model="filterTypeProxy" :options="typeFilterOptions" />
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <div class="w-32">
            <SelectUi v-model="sortByProxy" :options="sortOptions" />
          </div>
          <IconButtonUi
            size="sm"
            :title="sortDir === 'asc' ? 'Ascending' : 'Descending'"
            @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
          >
            <IconUi :name="sortDir === 'asc' ? 'move-up' : 'move-down'" size="size-3.5" />
          </IconButtonUi>
        </div>

        <SegmentedControlUi v-model="viewModeProxy" :options="viewOptions" size="xs" class="shrink-0">
          <template #option="{ option, active }">
            <IconUi :name="option.value === 'grid' ? 'elements' : 'list'" size="size-3.5" :class="active ? 'text-foreground' : 'text-secondary'" />
          </template>
        </SegmentedControlUi>

        <div class="mx-1 h-5 w-px shrink-0 bg-border" />

        <ButtonUi size="sm" variant="outline" class="shrink-0 text-[10px]" @click="createFolder">
          <IconUi name="folder" size="size-3.5" />
          Create folder
        </ButtonUi>
        <ButtonUi size="sm" class="shrink-0 text-[10px]" @click="uploadInput?.click()">
          <IconUi name="upload" size="size-3.5" />
          Upload file
        </ButtonUi>
        <input ref="uploadInput" type="file" multiple class="hidden" @change="onUploadFiles" />
      </div>

      <!-- Row 3: content (breadcrumb + files), detail panel beside it -->
      <div class="flex min-h-0 flex-1">
        <div class="flex min-w-0 flex-1 flex-col">
          <MediaBreadcrumb :current-folder="currentFolder" @navigate="navigate" />

          <MediaGrid
            v-model:selected-id="selectedItem"
            :items="itemsInView"
            :folders="foldersInView"
            :current-folder="currentFolder"
            :searching="isSearching"
            :view-mode="viewMode"
            @open-folder="openFolder"
            @create-folder="createFolder"
          />
        </div>

        <!-- Detail panel (when item selected) -->
        <MediaDetailPanel
          v-if="selectedMedia"
          :item="selectedMedia"
          @deleted="selectedItem = null"
        />
      </div>
    </div>
  </ModalUi>
</template>
