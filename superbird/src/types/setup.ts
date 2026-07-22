// Re-export of the shared API contract, so `@/types/setup` imports keep working.
// The canonical definitions live in @shared/types (shared with the server).
export type {
  Project,
  User,
  UserRole,
  SetupPayload,
  LoginPayload,
  InstallResult,
  SessionState,
} from '@shared/types'
