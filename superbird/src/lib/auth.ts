// Auth seam — now backed by the API. The server owns the password hash and the
// session cookie; there are no client-side credentials anymore.

import { apiPost } from '@/lib/api'
import type { User } from '@shared/types'

export async function login(email: string, password: string): Promise<User> {
  const { user } = await apiPost<{ user: User }>('/api/login', { email, password })
  return user
}

export async function logout(): Promise<void> {
  await apiPost<{ ok: true }>('/api/logout')
}
