// Setup / installation domain — the first-run flow that provisions a project
// and its admin user. Persistence is abstracted in @/lib/installer so this
// shape can be served by a real API/DB later without touching callers.

export interface Project {
  id: string
  name: string
  handle: string
  createdAt: string
}

export type UserRole = 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

// What the setup form collects.
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

// What a successful install returns (never includes the password).
export interface InstallResult {
  project: Project
  user: User
}
