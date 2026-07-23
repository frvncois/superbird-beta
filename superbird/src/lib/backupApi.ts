import { apiGet, apiPost, apiDelete } from '@/lib/api'
import type { BackupMeta } from '@shared/types'

export function listBackups(): Promise<{ backups: BackupMeta[] }> {
  return apiGet('/api/backups')
}

export function createBackup(label: string): Promise<BackupMeta> {
  return apiPost('/api/backups', { label })
}

export function restoreBackup(id: string): Promise<{ ok: boolean }> {
  return apiPost(`/api/backups/${id}/restore`)
}

export function deleteBackup(id: string): Promise<{ ok: boolean }> {
  return apiDelete(`/api/backups/${id}`)
}

export type Progress = (loaded: number, total: number) => void

// Download the portable .sbbackup (auth via the session cookie). Streamed so we
// can report download progress; handled as a blob so errors surface instead of
// navigating to a JSON error page.
export async function downloadExport(onProgress?: Progress): Promise<void> {
  const res = await fetch('/api/export')
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Export failed (${res.status})`)
  }
  const total = Number(res.headers.get('content-length')) || 0
  const disposition = res.headers.get('content-disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'superbird-backup.sbbackup'

  const chunks: Uint8Array[] = []
  let loaded = 0
  if (res.body) {
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      onProgress?.(loaded, total)
    }
  } else {
    chunks.push(new Uint8Array(await res.arrayBuffer()))
  }

  const blob = new Blob(chunks as BlobPart[])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Upload a .sbbackup and replace the current project. Uses XHR so we get real
// upload progress (fetch can't report it). The backup IS json, sent as the body.
export function importBackup(file: File, onProgress?: Progress): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/import')
    xhr.setRequestHeader('content-type', 'application/json')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      let msg = `Import failed (${xhr.status})`
      try {
        msg = JSON.parse(xhr.responseText).error ?? msg
      } catch {
        /* keep default */
      }
      reject(new Error(msg))
    }
    xhr.onerror = () => reject(new Error('Network error during import.'))
    xhr.send(file)
  })
}
