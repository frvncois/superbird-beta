// Auth seam — now backed by the API. The server owns the password hash and the
// session cookie; there are no client-side credentials anymore.

import { apiPost } from '@/lib/api'
import type { User, LoginResult, TwoFactorSetup, TwoFactorEnableResult } from '@shared/types'

// Step 1: returns a session ({ user }) or a 2FA challenge to complete.
export async function login(email: string, password: string, remember = false): Promise<LoginResult> {
  return apiPost<LoginResult>('/api/login', { email, password, remember })
}

// Step 2: complete a 2FA challenge with a TOTP or recovery code.
export async function verifyTwoFactor(challenge: string, code: string): Promise<User> {
  const { user } = await apiPost<{ user: User }>('/api/login/2fa', { challenge, code })
  return user
}

// ── 2FA enrollment (authenticated) ──
export function setupTwoFactor(): Promise<TwoFactorSetup> {
  return apiPost<TwoFactorSetup>('/api/2fa/setup')
}
export function enableTwoFactor(code: string): Promise<TwoFactorEnableResult> {
  return apiPost<TwoFactorEnableResult>('/api/2fa/enable', { code })
}
export async function disableTwoFactor(code: string): Promise<void> {
  await apiPost<{ ok: true }>('/api/2fa/disable', { code })
}

export async function logout(): Promise<void> {
  await apiPost<{ ok: true }>('/api/logout')
}

// Sign out on every device (revoke all sessions for the current user).
export async function logoutAll(): Promise<void> {
  await apiPost<{ ok: true }>('/api/logout-all')
}
