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
  twoFactorEnabled: boolean
}

// ── Two-factor (TOTP) ──

// Login step 1 returns either a session (no 2FA) or a challenge to complete.
export type LoginResult =
  | { user: User }
  | { twoFactorRequired: true; challenge: string }

export interface TwoFactorSetup {
  secret: string
  otpauthUri: string
}

export interface TwoFactorEnableResult {
  recoveryCodes: string[]
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
  // Opt into a long-lived (30-day) session; otherwise short-lived (1 day).
  remember?: boolean
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

// ── Fonts ──

export interface FontFaceDTO {
  weight: string
  style: 'normal' | 'italic'
  url: string
  format?: string
}

export interface FontFamilyDTO {
  id: string
  name: string
  source: 'custom'
  faces: FontFaceDTO[]
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

// ── Comments (editor-only annotations) ──
// Logged-in editors drop pins on the canvas; each pin is a thread. Anchored to a
// node via a normalized offset so the pin follows the element when it moves.
// Never published, never exported — its own table + auth-gated /api/comments.

export interface CommentAnchor {
  nodeId: string
  nx: number // 0..1 fraction of the node's rect width
  ny: number // 0..1 fraction of the node's rect height
}

export interface CommentReply {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export interface Comment {
  id: string
  pageId: string
  authorId: string
  authorName: string
  body: string
  anchor: CommentAnchor
  replies: CommentReply[]
  resolved: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentCreateInput {
  pageId: string
  anchor: CommentAnchor
  body: string
}

// ── Snapshots (version history) ──
// Point-in-time copies of the working document, auto-created on meaningful
// events + deduped by content hash. Own table; never published or exported.

export type SnapshotReason = 'open' | 'publish' | 'auto' | 'manual' | 'mcp-before' | 'mcp-after'

// Metadata row (the `document` is fetched separately for preview/restore).
export interface Snapshot {
  id: string
  reason: SnapshotReason
  label: string
  authorName: string
  size: number
  pinned: boolean
  createdAt: string
}

export interface SnapshotDetail extends Snapshot {
  document: ProjectDocument
}

export interface SnapshotCreateInput {
  reason?: SnapshotReason
  label?: string
}

export interface SnapshotCreateResult {
  snapshot: Snapshot
  deduped: boolean // true → identical to the latest, no new row created
}

// ── AI tools (MCP) ──
// A tool the assistant/MCP client can call. Shared by shared/aiTools.ts, the
// browser executors, the headless executor, and the MCP server.
export interface AiToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

// ── Backup / Export ──

export interface BackupMeta {
  id: string
  label: string
  kind: 'manual' | 'auto'
  size: number
  createdAt: string
}
