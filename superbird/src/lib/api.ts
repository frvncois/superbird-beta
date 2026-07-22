// Thin fetch wrapper for the admin API. Same-origin in dev (Vite proxies /api
// to the Hono server), so the session cookie flows automatically.

import type { SessionState } from '@shared/types'

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data && typeof data.error === 'string' ? data.error : `Request failed (${res.status})`
    throw new Error(message)
  }
  return data as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/** Boot call: install state + current session in one request. */
export function fetchSessionState(): Promise<SessionState> {
  return apiGet<SessionState>('/api/session')
}
