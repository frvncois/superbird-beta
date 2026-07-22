// Installation persistence — the single seam between the app and "the backend".
//
// PROTOTYPE: everything lives in localStorage and install() fakes a network
// round-trip. When the real server/DB is ready, swap the bodies of readInstall
// / install / clearInstall for API calls (e.g. GET/POST/DELETE /api/install);
// the signatures and return shapes stay identical, so no caller changes.

import type { InstallResult, SetupPayload, Project, User } from '@/types/setup'

const STORAGE_KEY = 'superbird.install.v1'

interface StoredInstall {
  project: Project
  user: User
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/** Current install state, or null if the app has never been set up. */
export function readInstall(): InstallResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredInstall
  } catch {
    return null
  }
}

/** Provision the project + admin user. Replace with `POST /api/install`. */
export async function install(payload: SetupPayload): Promise<InstallResult> {
  await delay(600) // simulate a server round-trip

  const now = new Date().toISOString()
  const project: Project = {
    id: randomId('proj'),
    name: payload.project.name,
    handle: payload.project.handle,
    createdAt: now,
  }
  const user: User = {
    id: randomId('user'),
    name: payload.admin.name,
    email: payload.admin.email,
    role: 'admin',
    createdAt: now,
  }

  // NOTE: the password is intentionally dropped in the prototype. Real
  // hashing + storage happens server-side once the DB/API exists.
  const stored: StoredInstall = { project, user }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

  return stored
}

/** Wipe install state (re-triggers the setup flow). Dev/testing helper. */
export function clearInstall(): void {
  localStorage.removeItem(STORAGE_KEY)
}
