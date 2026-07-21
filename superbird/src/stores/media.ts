import { ref } from 'vue'
import { defineStore } from 'pinia'
import { generateMediaId, generateFolderId } from '@/lib/ids'
import { getMediaTypeFromMime } from '@/lib/media'
import type { MediaFolder, MediaItem } from '@/types/canvas'

export const useMediaStore = defineStore('media', () => {
  const mediaItems = ref<MediaItem[]>([
    // Demo items
    { id: 'media-demo-1', name: 'hero-image.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 245000, width: 1920, height: 1080, tags: ['hero', 'banner'], createdAt: '2026-07-01' },
    { id: 'media-demo-2', name: 'team-photo.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 180000, width: 1200, height: 800, tags: ['team', 'about'], createdAt: '2026-07-05' },
    { id: 'media-demo-3', name: 'product-starter.png', url: '', type: 'image', mimeType: 'image/png', size: 95000, width: 800, height: 600, folderId: 'folder-demo-1', tags: ['product'], createdAt: '2026-07-10' },
    { id: 'media-demo-4', name: 'logo.svg', url: '', type: 'image', mimeType: 'image/svg+xml', size: 4200, tags: ['logo', 'brand'], createdAt: '2026-06-15' },
    { id: 'media-demo-5', name: 'blog-post-1.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 320000, width: 1600, height: 900, folderId: 'folder-demo-2', tags: ['blog'], createdAt: '2026-07-15' },
    { id: 'media-demo-6', name: 'brand-guide.pdf', url: '', type: 'document', mimeType: 'application/pdf', size: 2400000, tags: ['brand'], createdAt: '2026-06-20' },
  ])
  const mediaFolders = ref<MediaFolder[]>([
    { id: 'folder-demo-1', name: 'Products' },
    { id: 'folder-demo-2', name: 'Blog' },
  ])
  const mediaLibraryOpen = ref(false)

  function openLibrary() {
    mediaLibraryOpen.value = true
  }

  function closeLibrary() {
    mediaLibraryOpen.value = false
  }

  function addMediaItem(file: File): MediaItem {
    const item: MediaItem = {
      id: generateMediaId(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: getMediaTypeFromMime(file.type),
      mimeType: file.type,
      size: file.size,
      tags: [],
      createdAt: new Date().toISOString().split('T')[0]!,
    }
    if (item.type === 'image') {
      const img = new Image()
      img.onload = () => { item.width = img.width; item.height = img.height }
      img.src = item.url
    }
    mediaItems.value.unshift(item)
    return item
  }

  function removeMediaItem(id: string) {
    const item = mediaItems.value.find((m) => m.id === id)
    if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    mediaItems.value = mediaItems.value.filter((m) => m.id !== id)
  }

  function updateMediaItem(id: string, updates: Partial<Pick<MediaItem, 'name' | 'alt' | 'tags' | 'folderId'>>) {
    const item = mediaItems.value.find((m) => m.id === id)
    if (item) Object.assign(item, updates)
  }

  function moveMediaToFolder(itemId: string, folderId: string | undefined) {
    const item = mediaItems.value.find((m) => m.id === itemId)
    if (item) item.folderId = folderId
  }

  function addMediaFolder(name: string, parentId?: string): MediaFolder {
    const folder: MediaFolder = { id: generateFolderId(), name, parentId }
    mediaFolders.value.push(folder)
    return folder
  }

  function removeMediaFolder(id: string) {
    // Move items out of folder
    mediaItems.value.forEach((m) => { if (m.folderId === id) m.folderId = undefined })
    // Remove child folders
    mediaFolders.value.filter((f) => f.parentId === id).forEach((f) => removeMediaFolder(f.id))
    mediaFolders.value = mediaFolders.value.filter((f) => f.id !== id)
  }

  function renameMediaFolder(id: string, name: string) {
    const folder = mediaFolders.value.find((f) => f.id === id)
    if (folder) folder.name = name
  }

  return {
    mediaItems,
    mediaFolders,
    mediaLibraryOpen,
    openLibrary,
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
