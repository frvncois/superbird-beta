<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { formatFileSize } from '@/lib/media'
import type { MediaType } from '@/types/canvas'

const store = useCanvasStore()

const searchQuery = ref('')
const activeFolder = ref<string | undefined>(undefined)
const filterType = ref<MediaType | 'all'>('all')
const selectedItem = ref<string | null>(null)
const isDragOver = ref(false)
const showNewFolder = ref(false)
const newFolderName = ref('')

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

const allFolderItems = computed(() => {
  if (!activeFolder.value) return filteredItems.value
  return store.mediaItems.filter((m) => m.folderId === activeFolder.value)
})

const selectedMedia = computed(() =>
  store.mediaItems.find((m) => m.id === selectedItem.value),
)

const rootFolders = computed(() =>
  store.mediaFolders.filter((f) => !f.parentId),
)

function handleFilesDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (!files) return
  for (const file of files) {
    const item = store.addMediaItem(file)
    if (activeFolder.value) store.moveMediaToFolder(item.id, activeFolder.value)
  }
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (const file of input.files) {
    const item = store.addMediaItem(file)
    if (activeFolder.value) store.moveMediaToFolder(item.id, activeFolder.value)
  }
  input.value = ''
}

function createFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  store.addMediaFolder(name, activeFolder.value)
  newFolderName.value = ''
  showNewFolder.value = false
}

function deleteSelected() {
  if (!selectedItem.value) return
  store.removeMediaItem(selectedItem.value)
  selectedItem.value = null
}

function getTypeIcon(type: MediaType): string {
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'video'
    case 'audio': return 'audio'
    case 'document': return 'document'
    default: return 'file'
  }
}

const typeFilters: { key: MediaType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'document', label: 'Docs' },
  { key: 'audio', label: 'Audio' },
]
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="store.mediaLibraryOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-8">
        <div class="absolute inset-0 bg-foreground/30 backdrop-blur-sm" @click="store.mediaLibraryOpen = false" />

        <!-- Modal -->
        <div class="relative flex w-full max-w-5xl h-full max-h-[80vh] rounded-2xl border bg-background shadow-2xl overflow-hidden">

          <!-- Sidebar -->
          <div class="w-48 shrink-0 border-r flex flex-col">
            <div class="p-3 border-b">
              <span class="text-xs font-semibold">Media Library</span>
            </div>

            <!-- Folders -->
            <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
              <button
                :class="[
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors duration-100',
                  !activeFolder ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground/80 hover:bg-secondary/8',
                ]"
                @click="activeFolder = undefined"
              >
                <svg class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
                </svg>
                All Files
              </button>
              <button
                v-for="folder in rootFolders"
                :key="folder.id"
                :class="[
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors duration-100',
                  activeFolder === folder.id ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground/80 hover:bg-secondary/8',
                ]"
                @click="activeFolder = folder.id"
                @contextmenu.prevent
              >
                <svg class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
                </svg>
                {{ folder.name }}
              </button>
            </div>

            <!-- New folder -->
            <div class="p-2 border-t">
              <div v-if="showNewFolder" class="flex items-center gap-1">
                <input
                  v-model="newFolderName"
                  placeholder="Folder name"
                  class="h-7 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none"
                  @keydown.enter="createFolder"
                  @keydown.escape="showNewFolder = false"
                />
                <button class="h-7 rounded-lg bg-foreground px-2 text-[10px] font-medium text-background cursor-pointer" @click="createFolder">Add</button>
              </div>
              <button
                v-else
                class="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/8 hover:text-foreground transition-colors duration-100"
                @click="showNewFolder = true"
              >
                <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                New Folder
              </button>
            </div>
          </div>

          <!-- Main content -->
          <div class="flex-1 flex flex-col min-w-0">
            <!-- Toolbar -->
            <div class="flex items-center gap-2 border-b px-4 py-2.5 shrink-0">
              <!-- Search -->
              <div class="flex flex-1 items-center gap-2 rounded-xl border border-foreground/15 px-2.5 h-8">
                <svg class="size-3.5 text-secondary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
                </svg>
                <input
                  v-model="searchQuery"
                  placeholder="Search files..."
                  class="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/40 outline-none min-w-0"
                />
              </div>

              <!-- Type filters -->
              <div class="flex gap-0.5 rounded-lg bg-foreground/5 p-0.5 shrink-0">
                <button
                  v-for="f in typeFilters"
                  :key="f.key"
                  :class="[
                    'rounded-md px-2 py-1 text-[10px] font-medium cursor-pointer transition-all duration-100',
                    filterType === f.key ? 'bg-background text-foreground shadow-sm' : 'text-secondary hover:text-foreground',
                  ]"
                  @click="filterType = f.key"
                >
                  {{ f.label }}
                </button>
              </div>

              <!-- Upload button -->
              <label class="flex h-8 items-center gap-1.5 rounded-xl bg-foreground px-3 text-[10px] font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150 shrink-0">
                <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                Upload
                <input type="file" multiple class="hidden" @change="handleFileInput" />
              </label>

              <!-- Close -->
              <button
                class="flex size-8 items-center justify-center rounded-lg cursor-pointer text-secondary hover:bg-secondary/10 hover:text-foreground transition-colors duration-150 shrink-0"
                @click="store.mediaLibraryOpen = false"
              >
                <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <!-- Grid / Drop zone -->
            <div
              :class="['flex-1 overflow-y-auto p-4', isDragOver && 'bg-primary/5']"
              @dragover.prevent="isDragOver = true"
              @dragleave.self="isDragOver = false"
              @drop="handleFilesDrop"
            >
              <div v-if="filteredItems.length === 0 && !isDragOver" class="flex flex-col items-center justify-center h-full text-secondary gap-3">
                <svg class="size-12 text-secondary/30" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                <p class="text-sm">Drop files here or click Upload</p>
              </div>

              <div v-else-if="isDragOver" class="flex flex-col items-center justify-center h-full text-primary gap-3">
                <svg class="size-12" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                <p class="text-sm font-medium">Drop files to upload</p>
              </div>

              <div v-else class="grid grid-cols-4 gap-3">
                <div
                  v-for="item in filteredItems"
                  :key="item.id"
                  :class="[
                    'group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-100',
                    selectedItem === item.id ? 'ring-2 ring-primary border-primary' : 'border-foreground/10 hover:border-foreground/20',
                  ]"
                  @click="selectedItem = selectedItem === item.id ? null : item.id"
                >
                  <!-- Thumbnail -->
                  <div class="aspect-square bg-secondary/5 flex items-center justify-center">
                    <img v-if="item.type === 'image' && item.url" :src="item.url" :alt="item.alt ?? item.name" class="w-full h-full object-cover" />
                    <svg v-else-if="item.type === 'image'" class="size-8 text-secondary/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="item.type === 'document'" class="size-8 text-secondary/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else class="size-8 text-secondary/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Z" clip-rule="evenodd" />
                    </svg>
                  </div>

                  <!-- Info -->
                  <div class="px-2 py-1.5">
                    <div class="text-[10px] font-medium truncate">{{ item.name }}</div>
                    <div class="text-[9px] text-secondary">{{ formatFileSize(item.size) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detail panel (when item selected) -->
          <div v-if="selectedMedia" class="w-56 shrink-0 border-l flex flex-col">
            <div class="p-3 border-b">
              <span class="text-xs font-semibold">Details</span>
            </div>
            <div class="flex-1 overflow-y-auto p-3 space-y-3">
              <!-- Preview -->
              <div class="aspect-square rounded-lg bg-secondary/5 flex items-center justify-center overflow-hidden">
                <img v-if="selectedMedia.type === 'image' && selectedMedia.url" :src="selectedMedia.url" class="w-full h-full object-contain" />
                <span v-else class="text-xs text-secondary font-mono">{{ selectedMedia.mimeType }}</span>
              </div>

              <!-- Info -->
              <div class="space-y-1.5">
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Name</span>
                  <input
                    :value="selectedMedia.name"
                    class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground focus:border-foreground/40 outline-none"
                    @input="store.updateMediaItem(selectedMedia!.id, { name: ($event.target as HTMLInputElement).value })"
                  />
                </div>
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Alt Text</span>
                  <input
                    :value="selectedMedia.alt ?? ''"
                    placeholder="Describe the image"
                    class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none"
                    @input="store.updateMediaItem(selectedMedia!.id, { alt: ($event.target as HTMLInputElement).value || undefined })"
                  />
                </div>
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Folder</span>
                  <select
                    :value="selectedMedia.folderId ?? ''"
                    class="h-7 w-full min-w-0 appearance-none rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground cursor-pointer focus:border-foreground/40 outline-none"
                    @change="store.moveMediaToFolder(selectedMedia!.id, ($event.target as HTMLSelectElement).value || undefined)"
                  >
                    <option value="">No folder</option>
                    <option v-for="f in store.mediaFolders" :key="f.id" :value="f.id">{{ f.name }}</option>
                  </select>
                </div>
                <div class="flex items-center justify-between text-[10px] text-secondary pt-1">
                  <span>{{ formatFileSize(selectedMedia.size) }}</span>
                  <span v-if="selectedMedia.width">{{ selectedMedia.width }} x {{ selectedMedia.height }}</span>
                </div>
                <div class="text-[10px] text-secondary">{{ selectedMedia.createdAt }}</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-3 border-t">
              <button
                class="w-full h-7 rounded-lg border border-red-border bg-red-bg text-[10px] font-medium text-red-fg cursor-pointer hover:bg-red-bg/80 transition-colors duration-150"
                @click="deleteSelected"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
