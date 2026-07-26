<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useContextMenu } from '@/composables/useContextMenu'
import { useToast } from '@/composables/useToast'
import { formatFileSize } from '@/lib/media'
import { formatDate as fmtDate } from '@/lib/datetime'
import { separator, type ContextMenuItem } from '@/types/contextMenu'
import type { MediaFolder, MediaItem } from '@/types/canvas'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import ContextMenuUi from '@/components/ui/ContextMenuUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import InputUi from '@/components/ui/InputUi.vue'

const props = withDefaults(
  defineProps<{
    items: MediaItem[]
    folders: MediaFolder[]
    currentFolder?: string
    searching?: boolean
    viewMode?: 'grid' | 'list'
  }>(),
  { viewMode: 'grid' },
)


const selectedId = defineModel<string | null>('selectedId', { required: true })

const emit = defineEmits<{
  openFolder: [id: string]
  createFolder: []
}>()

const store = useMediaStore()
const ctx = useContextMenu()
const toast = useToast()

// Custom MIME so internal media drags are distinguishable from OS file drops.
const MEDIA_DND = 'application/superbird-media'

function isMediaDrag(e: DragEvent): boolean {
  return e.dataTransfer?.types.includes(MEDIA_DND) ?? false
}

function onItemDragStart(e: DragEvent, id: string) {
  e.dataTransfer?.setData(MEDIA_DND, id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

// Folder cards accept a dropped file → move it in.
const dragOverFolderId = ref<string | null>(null)

function onFolderDragOver(e: DragEvent, folderId: string) {
  if (!isMediaDrag(e)) return
  e.preventDefault()
  e.stopPropagation()
  dragOverFolderId.value = folderId
}

function onFolderDrop(e: DragEvent, folderId: string) {
  dragOverFolderId.value = null
  if (!isMediaDrag(e)) return
  e.preventDefault()
  e.stopPropagation()
  const id = e.dataTransfer?.getData(MEDIA_DND)
  if (id) store.moveMediaToFolder(id, folderId)
}

// In-flight uploads for the folder currently being viewed.
const pending = computed(() =>
  store.pendingUploads.filter((p) => (p.folderId ?? undefined) === props.currentFolder),
)

const isEmpty = computed(
  () => props.folders.length === 0 && props.items.length === 0 && pending.value.length === 0,
)

// Whether the folder we're viewing is private (itself or via an ancestor).
const currentFolderPrivate = computed(() => {
  let id = props.currentFolder
  const seen = new Set<string>()
  while (id && !seen.has(id)) {
    seen.add(id)
    const f = store.mediaFolders.find((x) => x.id === id)
    if (!f) break
    if (f.private) return true
    id = f.parentId
  }
  return false
})

const isDragOver = ref(false)

async function onFilesDrop(e: DragEvent) {
  // Only OS file drops upload here; internal media drags are handled elsewhere.
  if (!e.dataTransfer?.files.length) return
  e.preventDefault()
  isDragOver.value = false
  for (const file of e.dataTransfer.files) {
    await store.addMediaItem(file, props.currentFolder)
  }
}

function onItemClick(item: MediaItem) {
  if (store.isPicking) {
    store.pick(item)
    return
  }
  selectedId.value = selectedId.value === item.id ? null : item.id
}

// ── Uploads + context menus ──
const uploadInput = ref<HTMLInputElement | null>(null)

async function onUploadInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (const file of input.files) await store.addMediaItem(file, props.currentFolder)
  input.value = ''
}

function onItemContextMenu(e: MouseEvent, item: MediaItem) {
  const items: ContextMenuItem[] = [
    {
      id: 'rename',
      label: 'Rename',
      icon: 'rename',
      handler: () => renameItem(item),
    },
    {
      id: 'privacy',
      label: item.private ? 'Make public' : 'Make private',
      icon: item.private ? 'eye' : 'eye-slash',
      handler: () => toggleItemPrivate(item),
    },
    {
      id: 'copy-url',
      label: 'Copy URL',
      icon: 'copy',
      handler: () => copyUrl(item),
    },
    separator(),
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      danger: true,
      handler: () => deleteItem(item),
    },
  ]
  ctx.open(e, items)
}

function onFolderContextMenu(e: MouseEvent, folder: MediaFolder) {
  const items: ContextMenuItem[] = [
    { id: 'open', label: 'Open', icon: 'folder', handler: () => emit('openFolder', folder.id) },
    { id: 'rename', label: 'Rename', icon: 'rename', handler: () => renameFolder(folder) },
    {
      id: 'privacy',
      label: folder.private ? 'Make public' : 'Make private',
      icon: folder.private ? 'eye' : 'eye-slash',
      handler: () => toggleFolderPrivate(folder),
    },
    separator(),
    { id: 'delete', label: 'Delete', icon: 'delete', danger: true, handler: () => deleteFolder(folder) },
  ]
  ctx.open(e, items)
}

function onEmptyContextMenu(e: MouseEvent) {
  const items: ContextMenuItem[] = [
    { id: 'upload', label: 'Upload files', icon: 'upload', handler: () => uploadInput?.value?.click() },
    { id: 'new-folder', label: 'Create folder', icon: 'folder', handler: () => emit('createFolder') },
  ]
  ctx.open(e, items)
}

// ── Rename (file or folder) — one dialog, discriminated payload ──
const renameTarget = ref<{ kind: 'file' | 'folder'; id: string; original: string } | null>(null)
const renameValue = ref('')
const renameInput = ref<HTMLElement | null>(null)

watch(renameTarget, async (t) => {
  if (!t) return
  await nextTick()
  renameInput.value?.querySelector('input')?.focus()
})

function doRename() {
  const t = renameTarget.value
  if (!t) return
  const name = renameValue.value.trim()
  if (name && name !== t.original) {
    if (t.kind === 'file') store.updateMediaItem(t.id, { name })
    else store.renameMediaFolder(t.id, name)
  }
  renameTarget.value = null
}

// ── Item actions ──
function renameItem(item: MediaItem) {
  renameTarget.value = { kind: 'file', id: item.id, original: item.name }
  renameValue.value = item.name
}
async function toggleItemPrivate(item: MediaItem) {
  const next = !item.private
  await store.updateMediaItem(item.id, { private: next })
  toast.success(next ? 'File is now private' : 'File is now public')
}
async function copyUrl(item: MediaItem) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${item.url}`)
    toast.success('URL copied')
  } catch {
    toast.error('Could not copy URL')
  }
}
const pendingDeleteItem = ref<MediaItem | null>(null)
function deleteItem(item: MediaItem) {
  pendingDeleteItem.value = item
}
function doDeleteItem() {
  const item = pendingDeleteItem.value
  if (!item) return
  if (selectedId.value === item.id) selectedId.value = null
  store.removeMediaItem(item.id)
  toast.success('Media deleted')
  pendingDeleteItem.value = null
}

// ── Folder actions ──
function renameFolder(folder: MediaFolder) {
  renameTarget.value = { kind: 'folder', id: folder.id, original: folder.name }
  renameValue.value = folder.name
}
async function toggleFolderPrivate(folder: MediaFolder) {
  const next = !folder.private
  await store.setMediaFolderPrivate(folder.id, next)
  toast.success(next ? 'Folder is now private' : 'Folder is now public')
}
const pendingDeleteFolder = ref<MediaFolder | null>(null)
function deleteFolder(folder: MediaFolder) {
  pendingDeleteFolder.value = folder
}
function doDeleteFolder() {
  const folder = pendingDeleteFolder.value
  if (!folder) return
  store.removeMediaFolder(folder.id)
  toast.success('Folder deleted')
  pendingDeleteFolder.value = null
}
</script>

<template>
  <div
    :class="['flex-1 overflow-y-auto p-4', isDragOver && 'bg-primary/5']"
    @dragover="(e) => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); isDragOver = true } }"
    @dragleave.self="isDragOver = false"
    @drop="onFilesDrop"
    @contextmenu.prevent="onEmptyContextMenu"
  >
    <EmptyStateUi v-if="isDragOver" class="h-full">
      <IconUi name="upload" size="size-12" class="text-primary" />
      <p class="text-sm font-medium text-primary">Drop files to upload</p>
    </EmptyStateUi>

    <template v-else>
      <!-- Private-folder note -->
      <div
        v-if="currentFolderPrivate"
        class="mb-3 flex items-center gap-2 rounded-lg bg-secondary/8 px-3 py-2 text-[11px] text-secondary"
      >
        <IconUi name="lock" size="size-3.5" class="shrink-0" />
        Everything in this folder is private — hidden from the published site and non-logged-in visitors.
      </div>

      <div v-if="viewMode === 'grid'" class="grid grid-cols-4 gap-3">
        <!-- Folder cards (drop a file here to move it in) -->
        <button
          v-for="folder in folders"
          :key="folder.id"
          :class="[
            'group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border cursor-pointer transition-all duration-100',
            dragOverFolderId === folder.id ? 'border-primary bg-primary/10 ring-2 ring-primary/40' : 'border-foreground/10 hover:border-foreground/25 hover:bg-secondary/5',
          ]"
          @click="emit('openFolder', folder.id)"
          @contextmenu="(e) => onFolderContextMenu(e, folder)"
          @dragover="(e) => onFolderDragOver(e, folder.id)"
          @dragleave="dragOverFolderId = null"
          @drop="(e) => onFolderDrop(e, folder.id)"
        >
          <div class="relative">
            <IconUi name="folder" size="size-12" class="text-secondary/60 group-hover:text-secondary" />
            <span
              v-if="folder.private"
              class="absolute -right-1 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background"
              title="Private folder"
            >
              <IconUi name="lock" size="size-2.5" />
            </span>
          </div>
          <span class="max-w-full truncate px-2 text-[11px] font-medium">{{ folder.name }}</span>
        </button>

        <!-- Uploading + converting skeletons -->
        <div
          v-for="p in pending"
          :key="p.id"
          class="relative overflow-hidden rounded-xl border border-foreground/10"
        >
          <div class="flex aspect-square items-center justify-center bg-secondary/5">
            <span class="size-6 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary/70" />
          </div>
          <div class="px-2 py-1.5">
            <div class="truncate text-[10px] font-medium text-secondary">{{ p.name }}</div>
            <div class="text-[9px] text-secondary/60">Converting…</div>
          </div>
        </div>

        <!-- File cards (draggable → drop onto a folder or breadcrumb) -->
        <div
          v-for="item in items"
          :key="item.id"
          draggable="true"
          :class="[
            'group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-100',
            selectedId === item.id ? 'ring-2 ring-primary border-primary' : 'border-foreground/10 hover:border-foreground/20',
            store.isPicking && 'hover:ring-2 hover:ring-primary/50',
          ]"
          @click="onItemClick(item)"
          @contextmenu="(e) => onItemContextMenu(e, item)"
          @dragstart="(e) => onItemDragStart(e, item.id)"
        >
          <!-- Thumbnail -->
          <div class="relative flex aspect-square items-center justify-center bg-secondary/5">
            <img v-if="item.type === 'image' && item.url" :src="item.url" :alt="item.alt ?? item.name" class="h-full w-full object-cover" />
            <IconUi v-else-if="item.type === 'image'" name="image" size="size-8" class="text-secondary/30" />
            <IconUi v-else name="document" size="size-8" class="text-secondary/30" />
            <span
              v-if="item.private"
              class="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background backdrop-blur-sm"
              title="Private"
            >
              <IconUi name="lock" size="size-3" />
            </span>
          </div>

          <!-- Info -->
          <div class="px-2 py-1.5">
            <div class="truncate text-[10px] font-medium">{{ item.name }}</div>
            <div class="text-[9px] text-secondary">{{ formatFileSize(item.size) }}</div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="space-y-0.5">
        <!-- Folder rows (drop target) -->
        <div
          v-for="folder in folders"
          :key="folder.id"
          :class="[
            'group flex items-center gap-3 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors duration-100',
            dragOverFolderId === folder.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-secondary/5',
          ]"
          @click="emit('openFolder', folder.id)"
          @contextmenu="(e) => onFolderContextMenu(e, folder)"
          @dragover="(e) => onFolderDragOver(e, folder.id)"
          @dragleave="dragOverFolderId = null"
          @drop="(e) => onFolderDrop(e, folder.id)"
        >
          <div class="flex size-9 shrink-0 items-center justify-center">
            <IconUi name="folder" size="size-6" class="text-secondary/70" />
          </div>
          <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ folder.name }}</span>
          <IconUi v-if="folder.private" name="lock" size="size-3" class="shrink-0 text-secondary" />
          <span class="w-24 shrink-0 text-[11px] text-secondary">Folder</span>
          <span class="w-20 shrink-0 text-right text-[11px] text-secondary">—</span>
          <span class="w-28 shrink-0 text-right text-[11px] text-secondary">—</span>
        </div>

        <!-- Pending rows -->
        <div v-for="p in pending" :key="p.id" class="flex items-center gap-3 rounded-lg px-2.5 py-1.5">
          <div class="flex size-9 shrink-0 items-center justify-center">
            <span class="size-5 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary/70" />
          </div>
          <span class="min-w-0 flex-1 truncate text-xs font-medium text-secondary">{{ p.name }}</span>
          <span class="text-[11px] text-secondary/60">Converting…</span>
        </div>

        <!-- File rows -->
        <div
          v-for="item in items"
          :key="item.id"
          draggable="true"
          :class="[
            'group flex items-center gap-3 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors duration-100',
            selectedId === item.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/5',
          ]"
          @click="onItemClick(item)"
          @contextmenu="(e) => onItemContextMenu(e, item)"
          @dragstart="(e) => onItemDragStart(e, item.id)"
        >
          <div class="relative size-9 shrink-0 overflow-hidden rounded bg-secondary/5">
            <img v-if="item.type === 'image' && item.url" :src="item.url" :alt="item.alt ?? item.name" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center">
              <IconUi :name="item.type === 'image' ? 'image' : 'document'" size="size-4" class="text-secondary/40" />
            </div>
          </div>
          <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ item.name }}</span>
          <IconUi v-if="item.private" name="lock" size="size-3" class="shrink-0 text-secondary" title="Private" />
          <span class="w-24 shrink-0 truncate text-[11px] capitalize text-secondary">{{ item.type }}</span>
          <span class="w-20 shrink-0 text-right text-[11px] text-secondary">{{ formatFileSize(item.size) }}</span>
          <span class="w-28 shrink-0 text-right text-[11px] text-secondary">{{ fmtDate(item.createdAt) }}</span>
        </div>
      </div>

      <!-- Empty -->
      <EmptyStateUi v-if="isEmpty" class="mt-12">
        <template v-if="searching">
          <IconUi name="search" size="size-10" class="text-secondary/30" />
          <p class="text-sm">No matches</p>
        </template>
        <template v-else>
          <IconUi name="image" size="size-10" class="text-secondary/30" />
          <p class="text-sm">No files here yet</p>
          <p class="text-xs text-secondary">Use “Upload file” to add media.</p>
        </template>
      </EmptyStateUi>
    </template>

    <input ref="uploadInput" type="file" multiple class="hidden" @change="onUploadInput" />

    <ContextMenuUi
      v-if="ctx.visible.value"
      :items="ctx.items.value"
      :x="ctx.x.value"
      :y="ctx.y.value"
      @close="ctx.close"
    />

    <!-- Rename file / folder -->
    <ModalUi
      :open="!!renameTarget"
      variant="dialog"
      :title="renameTarget?.kind === 'folder' ? 'Rename folder' : 'Rename file'"
      @update:open="renameTarget = null"
    >
      <div ref="renameInput">
        <InputUi
          v-model="renameValue"
          :placeholder="renameTarget?.kind === 'folder' ? 'Folder name' : 'File name'"
          size="default"
          @keydown.enter="doRename"
        />
      </div>
      <template #actions>
        <ButtonUi variant="ghost" @click="renameTarget = null">Cancel</ButtonUi>
        <ButtonUi variant="default" @click="doRename">Rename</ButtonUi>
      </template>
    </ModalUi>

    <!-- Delete media -->
    <ConfirmDialogUi
      :open="!!pendingDeleteItem"
      title="Delete media"
      :description="
        pendingDeleteItem
          ? `Delete “${pendingDeleteItem.name}”? Any element using it will lose its image. This can’t be undone.`
          : ''
      "
      confirm-label="Delete"
      @update:open="pendingDeleteItem = null"
      @confirm="doDeleteItem"
    />

    <!-- Delete folder -->
    <ConfirmDialogUi
      :open="!!pendingDeleteFolder"
      title="Delete folder"
      :description="
        pendingDeleteFolder
          ? `Delete the folder “${pendingDeleteFolder.name}”? Media inside it won’t be deleted — it moves to the parent. This can’t be undone.`
          : ''
      "
      confirm-label="Delete"
      @update:open="pendingDeleteFolder = null"
      @confirm="doDeleteFolder"
    />
  </div>
</template>
