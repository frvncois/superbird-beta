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

// ── AI assistant ──
// Provider-agnostic wire protocol (Anthropic-shaped blocks; the server adapts
// them to each provider). The API key never reaches the client.

// 'openai'/'groq' use the OpenAI chat-completions format (built-in base URLs);
// 'custom' is any other OpenAI-compatible endpoint (OpenRouter, Ollama, …).
export type AiProvider = 'anthropic' | 'openai' | 'groq' | 'custom'

// What the client is allowed to know about the config (never the key itself).
export interface AiConfigPublic {
  configured: boolean
  provider: AiProvider
  model: string
  baseUrl: string // only meaningful for 'custom'
}

export interface AiConfigUpdate {
  provider: AiProvider
  apiKey?: string // omitted → keep the stored key
  model: string
  baseUrl?: string // for 'custom' (OpenAI-compatible endpoint)
}

export interface AiTextBlock {
  type: 'text'
  text: string
}
export interface AiToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}
export interface AiToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}
export type AiBlock = AiTextBlock | AiToolUseBlock | AiToolResultBlock

export interface AiMessage {
  role: 'user' | 'assistant'
  content: AiBlock[]
}

export interface AiToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface AiChatRequest {
  system: string
  messages: AiMessage[]
  tools: AiToolDef[]
}

export interface AiChatResponse {
  content: AiBlock[]
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop'
}
