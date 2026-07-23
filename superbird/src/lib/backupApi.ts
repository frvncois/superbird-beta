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

// Download the portable .sbbackup (auth via the session cookie). Handled as a
// blob so errors surface instead of navigating to a JSON error page.
export async function downloadExport(): Promise<void> {
  const res = await fetch('/api/export')
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Export failed (${res.status})`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'superbird-backup.sbbackup'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Upload a .sbbackup and replace the current project. Sends the file text as the
// JSON body (the backup IS json).
export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const res = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: text })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Import failed (${res.status})`)
  }
}
