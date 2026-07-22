// Authentication — the session seam, parallel to @/lib/installer.
//
// PROTOTYPE: sessions and (temporarily) the admin credentials live in
// localStorage. When the real API exists, swap the bodies of login/logout/
// getSession for POST /api/login, POST /api/logout, GET /api/session — the
// signatures stay identical. saveCredentials/CRED_KEY disappear entirely
// (the server owns the password hash).

import { readInstall } from './installer'
import type { User } from '@/types/setup'

const SESSION_KEY = 'superbird.session.v1'
const CRED_KEY = 'superbird.credentials.v1' // PROTOTYPE ONLY — remove with real API

interface Credentials {
  email: string
  password: string
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// PROTOTYPE: persist admin credentials so login can verify them locally.
// Real auth verifies a server-side hash — this goes away when the API lands.
export function saveCredentials(email: string, password: string): void {
  localStorage.setItem(CRED_KEY, JSON.stringify({ email, password }))
}

function readCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CRED_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

function startSession(userId: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
}

/** Verify credentials and open a session. Replace with `POST /api/login`. */
export async function login(email: string, password: string): Promise<User> {
  await delay(400)
  const install = readInstall()
  const cred = readCredentials()
  const match =
    install &&
    cred &&
    cred.email.trim().toLowerCase() === email.trim().toLowerCase() &&
    cred.password === password
  if (!match) throw new Error('Incorrect email or password.')
  startSession(install!.user.id)
  return install!.user
}

/** End the session. Replace with `POST /api/logout`. */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

/** The authenticated user for the current session, or null. `GET /api/session`. */
export function getSession(): User | null {
  const install = readInstall()
  if (!install) return null
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as { userId: string }
    return session.userId === install.user.id ? install.user : null
  } catch {
    return null
  }
}

/** Clear all auth state (session + prototype credentials). */
export function clearAuth(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(CRED_KEY)
}
