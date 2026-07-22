// Client seam for user management (Settings → Users). Mirrors src/lib/api.ts.
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import type { User } from '@shared/types'

export function listUsers(): Promise<{ users: User[] }> {
  return apiGet('/api/users')
}

export function createUser(payload: { name: string; email: string; password: string }): Promise<User> {
  return apiPost('/api/users', payload)
}

export function deleteUser(id: string): Promise<{ ok: boolean }> {
  return apiDelete(`/api/users/${id}`)
}
