import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import type { Comment, CommentCreateInput } from '@shared/types'

// Two-letter initials for an author chip (mirrors the UsersPanel idiom).
export function commentInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

// Editor-only annotation threads. Server-backed (own /api/comments table),
// never part of the project document, so it's excluded from publish + undo.
export const useCommentsStore = defineStore('comments', () => {
  const items = ref<Comment[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  // Coordination channel: the header inbox asks the canvas to scroll to + open a
  // thread. A fresh object each call so re-focusing the same id re-triggers.
  const focusRequest = ref<{ id: string } | null>(null)
  function requestFocus(id: string) {
    focusRequest.value = { id }
  }
  function clearFocus() {
    focusRequest.value = null
  }

  async function load() {
    loading.value = true
    try {
      const res = await apiGet<{ items: Comment[] }>('/api/comments')
      items.value = res.items
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  // Server assigns id/author/timestamps → await, then prepend the real record.
  async function create(input: CommentCreateInput): Promise<Comment> {
    const created = await apiPost<Comment>('/api/comments', input)
    items.value.unshift(created)
    return created
  }

  async function setResolved(id: string, resolved: boolean) {
    const item = items.value.find((c) => c.id === id)
    if (item) item.resolved = resolved // optimistic
    const updated = await apiPatch<Comment>(`/api/comments/${id}`, { resolved })
    replace(updated)
  }

  async function edit(id: string, body: string) {
    const updated = await apiPatch<Comment>(`/api/comments/${id}`, { body })
    replace(updated)
  }

  async function addReply(id: string, body: string) {
    const updated = await apiPost<Comment>(`/api/comments/${id}/replies`, { body })
    replace(updated)
  }

  async function removeReply(id: string, replyId: string) {
    const updated = await apiDelete<Comment>(`/api/comments/${id}/replies/${replyId}`)
    replace(updated)
  }

  async function remove(id: string) {
    items.value = items.value.filter((c) => c.id !== id) // optimistic
    await apiDelete(`/api/comments/${id}`)
  }

  function replace(updated: Comment) {
    const i = items.value.findIndex((c) => c.id === updated.id)
    if (i !== -1) items.value.splice(i, 1, updated)
  }

  // Getters — parameterized plain fns per store convention.
  function byPage(pageId: string) {
    return items.value.filter((c) => c.pageId === pageId)
  }
  function openByPage(pageId: string) {
    return items.value.filter((c) => c.pageId === pageId && !c.resolved)
  }
  const unresolvedCount = computed(() => items.value.filter((c) => !c.resolved).length)

  return {
    items,
    loading,
    loaded,
    focusRequest,
    requestFocus,
    clearFocus,
    load,
    create,
    setResolved,
    edit,
    addReply,
    removeReply,
    remove,
    byPage,
    openByPage,
    unresolvedCount,
  }
})
