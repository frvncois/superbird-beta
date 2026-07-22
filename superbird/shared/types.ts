// Canonical API contract — shared by the Vue client (@shared/*) and the Hono
// server (relative import). Keep this framework-free (types only).

export type UserRole = 'admin'

export interface Project {
  id: string
  name: string
  handle: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

// ── Request payloads ──

export interface SetupPayload {
  project: {
    name: string
    handle: string
  }
  admin: {
    name: string
    email: string
    password: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

// ── Responses ──

// Install result (never includes the password).
export interface InstallResult {
  project: Project
  user: User
}

// One boot call: everything the client needs to route on startup.
export interface SessionState {
  installed: boolean
  project: Project | null
  user: User | null
}
