import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiUpload, apiPatch, apiDelete, apiPost } from '@/lib/api'
import type { MediaFolder, MediaItem } from '@/types/canvas'

// Media is API-backed: metadata lives in the DB, files on disk, served at
// /media/:id. Loaded on sign-in; uploads/edits/folders hit the API.
export interface PendingUpload {
  id: string
  name: string
  folderId?: string
}

export const useMediaStore = defineStore('media', () => {
  const mediaItems = ref<MediaItem[]>([])
  const mediaFolders = ref<MediaFolder[]>([])
  // In-flight uploads (skeleton placeholders while uploading + converting).
  const pendingUploads = ref<PendingUpload[]>([])
  const mediaLibraryOpen = ref(false)

  // When set, the library is acting as a picker: choosing an item invokes the
  // callback and closes, instead of just browsing.
  const pickCallback = ref<((item: MediaItem) => void) | null>(null)
  const isPicking = computed(() => pickCallback.value !== null)

  async function load() {
    const { items, folders } = await apiGet<{ items: MediaItem[]; folders: MediaFolder[] }>('/api/media')
    mediaItems.value = items
    mediaFolders.value = folders
  }

  function openLibrary() {
    pickCallback.value = null
    mediaLibraryOpen.value = true
  }

  function openPicker(onPick: (item: MediaItem) => void) {
    pickCallback.value = onPick
    mediaLibraryOpen.value = true
  }

  function pick(item: MediaItem) {
    pickCallback.value?.(item)
    pickCallback.value = null
    mediaLibraryOpen.value = false
  }

  function closeLibrary() {
    pickCallback.value = null
    mediaLibraryOpen.value = false
  }

  // Read an image's natural dimensions client-side (the server stores them).
  function imageDimensions(file: File): Promise<{ width?: number; height?: number }> {
    if (!file.type.startsWith('image/')) return Promise.resolve({})
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        resolve({})
        URL.revokeObjectURL(url)
      }
      img.src = url
    })
  }

  async function addMediaItem(file: File, folderId?: string): Promise<MediaItem> {
    const pendingId = `pending-${Math.random().toString(36).slice(2)}`
    pendingUploads.value.push({ id: pendingId, name: file.name, folderId })
    try {
      const { width, height } = await imageDimensions(file)
      const form = new FormData()
      form.append('file', file)
      if (width) form.append('width', String(width))
      if (height) form.append('height', String(height))
      if (folderId) form.append('folderId', folderId)
      const item = await apiUpload<MediaItem>('/api/media', form)
      mediaItems.value.unshift(item)
      return item
    } finally {
      pendingUploads.value = pendingUploads.value.filter((p) => p.id !== pendingId)
    }
  }

  async function removeMediaItem(id: string) {
    mediaItems.value = mediaItems.value.filter((m) => m.id !== id)
    await apiDelete(`/api/media/${id}`)
  }

  async function updateMediaItem(
    id: string,
    updates: Partial<Pick<MediaItem, 'name' | 'alt' | 'tags' | 'folderId'>>,
  ) {
    const item = mediaItems.value.find((m) => m.id === id)
    if (item) Object.assign(item, updates)
    await apiPatch(`/api/media/${id}`, updates)
  }

  async function moveMediaToFolder(itemId: string, folderId: string | undefined) {
    const item = mediaItems.value.find((m) => m.id === itemId)
    if (item) item.folderId = folderId
    await apiPatch(`/api/media/${itemId}`, { folderId: folderId ?? null })
  }

  async function addMediaFolder(name: string, parentId?: string): Promise<MediaFolder> {
    const folder = await apiPost<MediaFolder>('/api/media/folders', { name, parentId })
    mediaFolders.value.push(folder)
    return folder
  }

  async function removeMediaFolder(id: string) {
    // Mirror the server cascade locally: unassign items, drop the folder + children.
    mediaItems.value.forEach((m) => {
      if (m.folderId === id) m.folderId = undefined
    })
    mediaFolders.value = mediaFolders.value.filter((f) => f.id !== id && f.parentId !== id)
    await apiDelete(`/api/media/folders/${id}`)
  }

  async function renameMediaFolder(id: string, name: string) {
    const folder = mediaFolders.value.find((f) => f.id === id)
    if (folder) folder.name = name
    await apiPatch(`/api/media/folders/${id}`, { name })
  }

  return {
    mediaItems,
    mediaFolders,
    pendingUploads,
    mediaLibraryOpen,
    isPicking,
    load,
    openLibrary,
    openPicker,
    pick,
    closeLibrary,
    addMediaItem,
    removeMediaItem,
    updateMediaItem,
    moveMediaToFolder,
    addMediaFolder,
    removeMediaFolder,
    renameMediaFolder,
  }
})
