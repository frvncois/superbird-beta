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
  // When the site was last published (design snapshot), or null if never.
  publishedAt: string | null
}

export interface PublishResult {
  publishedAt: string
}

// ── Project document ──
// The whole editable project, stored as one JSON blob per project. The server
// treats design/content as opaque JSON; the client owns the precise shapes
// (Page[], StyleClass records, Collection[], Entry[], …), so these are `unknown`
// here. Normalising content into queryable rows is a later (SSR) concern.

export interface ProjectDesign {
  pages: unknown[]
  styleClasses: Record<string, unknown>
  globalStyles: unknown
  userComponents: Record<string, unknown>
  siteSettings: unknown
  locales: { locales: unknown[]; activeLocale: string; defaultLocale: string }
}

export interface ProjectContent {
  collections: unknown[]
  entries: unknown[]
}

export interface ProjectDocument {
  design: ProjectDesign | null
  content: ProjectContent
}
