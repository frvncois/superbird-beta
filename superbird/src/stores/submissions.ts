import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPatch, apiDelete } from '@/lib/api'

export type EmailStatus = 'skipped' | 'sent' | 'failed'

export interface Submission {
  id: string
  formId: string
  formName: string
  data: Record<string, string>
  pageUrl?: string
  ip?: string
  seen: boolean
  emailStatus: EmailStatus
  emailedTo?: string
  createdAt: string
}

export interface SubmittedForm {
  formId: string
  formName: string
  count: number
}

export interface SubmissionQuery {
  formId?: string
  status?: 'unread' | 'sent' | 'seen'
  from?: string
  to?: string
  search?: string
}

export const useSubmissionsStore = defineStore('submissions', () => {
  const items = ref<Submission[]>([])
  const forms = ref<SubmittedForm[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(q: SubmissionQuery = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (q.formId) params.set('formId', q.formId)
      if (q.status) params.set('status', q.status)
      if (q.from) params.set('from', q.from)
      if (q.to) params.set('to', q.to)
      if (q.search) params.set('search', q.search)
      const qs = params.toString()
      const res = await apiGet<{ items: Submission[] }>(`/api/forms/submissions${qs ? `?${qs}` : ''}`)
      items.value = res.items
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadForms() {
    const res = await apiGet<{ forms: SubmittedForm[] }>('/api/forms/submitted-forms')
    forms.value = res.forms
  }

  async function markSeen(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (item && !item.seen) {
      item.seen = true
      await apiPatch(`/api/forms/submissions/${id}`)
    }
  }

  async function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    await apiDelete(`/api/forms/submissions/${id}`)
  }

  return { items, forms, loading, loaded, load, loadForms, markSeen, remove }
})
