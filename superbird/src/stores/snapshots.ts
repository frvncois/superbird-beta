import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import { formatDate } from '@/lib/datetime'
import type { ProjectDocument, Snapshot, SnapshotCreateInput, SnapshotCreateResult, SnapshotDetail } from '@shared/types'

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Version history of the working document. Server-backed (own /api/snapshots
// table); never part of the project doc, publish snapshot, portable export, or undo.
export const useSnapshotsStore = defineStore('snapshots', () => {
  const items = ref<Snapshot[]>([]) // metadata only, newest-first
  const loading = ref(false)
  const loaded = ref(false)
  // Read-only preview of a past document (drives SnapshotPreviewOverlay).
  const previewDoc = ref<ProjectDocument | null>(null)
  const previewMeta = ref<Snapshot | null>(null)

  async function load() {
    loading.value = true
    try {
      const res = await apiGet<{ items: Snapshot[] }>('/api/snapshots')
      items.value = res.items
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  // Server assigns id/author/timestamps and dedups vs the latest.
  async function create(input: SnapshotCreateInput = {}): Promise<SnapshotCreateResult> {
    const res = await apiPost<SnapshotCreateResult>('/api/snapshots', input)
    if (!res.deduped) items.value.unshift(res.snapshot)
    return res
  }

  async function setPinned(id: string, pinned: boolean) {
    const item = items.value.find((s) => s.id === id)
    if (item) item.pinned = pinned // optimistic
    await apiPatch<Snapshot>(`/api/snapshots/${id}`, { pinned })
  }

  async function remove(id: string) {
    items.value = items.value.filter((s) => s.id !== id) // optimistic
    await apiDelete(`/api/snapshots/${id}`)
  }

  // Overwrite the working doc with a past version, then re-hydrate every store
  // and clear undo so it can't pop the pre-restore doc back. Lazy imports avoid a
  // static import cycle with useProjectPersistence.
  async function restore(id: string) {
    await apiPost(`/api/snapshots/${id}/restore`)
    const { useProjectPersistence } = await import('@/composables/useProjectPersistence')
    const { useHistory } = await import('@/composables/useHistory')
    await useProjectPersistence().load()
    useHistory().reset()
    await load() // the restore added a "Before restore" safety snapshot
  }

  async function openPreview(id: string) {
    const detail = await apiGet<SnapshotDetail>(`/api/snapshots/${id}`)
    previewMeta.value = detail
    previewDoc.value = detail.document
  }
  function closePreview() {
    previewDoc.value = null
    previewMeta.value = null
  }

  // Group by calendar day for the popover list (items already newest-first).
  const grouped = computed(() => {
    const groups: { key: string; label: string; items: Snapshot[] }[] = []
    const byKey = new Map<string, { key: string; label: string; items: Snapshot[] }>()
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86_400_000))
    for (const s of items.value) {
      const key = dayKey(new Date(s.createdAt))
      let g = byKey.get(key)
      if (!g) {
        const label = key === today ? 'Today' : key === yesterday ? 'Yesterday' : formatDate(s.createdAt)
        g = { key, label, items: [] }
        byKey.set(key, g)
        groups.push(g)
      }
      g.items.push(s)
    }
    return groups
  })

  return {
    items,
    loading,
    loaded,
    previewDoc,
    previewMeta,
    load,
    create,
    setPinned,
    remove,
    restore,
    openPreview,
    closePreview,
    grouped,
  }
})
