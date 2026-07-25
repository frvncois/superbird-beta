import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'
import { adminIpAllowed } from './ipAllow'
import type { User } from '../../shared/types'

export const SESSION_COOKIE = 'sb_session'
// Short by default; "remember me" opts into the long-lived session.
export const SESSION_TTL_SHORT_MS = 1000 * 60 * 60 * 24 // 1 day
export const SESSION_TTL_LONG_MS = 1000 * 60 * 60 * 24 * 30 // 30 days
// Send the cookie only over HTTPS in production (localhost dev stays HTTP).
const SECURE_COOKIE = process.env.NODE_ENV === 'production'

// Row → public User (never exposes passwordHash). Single-admin model: every
// user is a full admin (see docs — roles were intentionally dropped).
export function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: 'admin',
    createdAt: row.createdAt,
    twoFactorEnabled: row.totpEnabled === 1,
  }
}

// Hono middleware: 401 unless a valid session cookie resolves to a user.
// Apply as `router.use('*', requireAuth)` — covers every path incl. the bare
// mount point.
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  // Network lockdown (SUPERBIRD_ADMIN_ALLOW_IPS) — hide the surface from
  // off-network callers before any session work. No-op when unset.
  if (!adminIpAllowed(c)) return c.json({ error: 'Forbidden' }, 403)
  if (!currentUser(c)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}

/** Create a session for a user and set the cookie. Rotates: any session tied to
 *  the incoming cookie is dropped first, so re-login never leaves orphans and a
 *  pre-auth cookie can't be fixated. */
export function startSession(c: Context, userId: string, ttlMs: number = SESSION_TTL_SHORT_MS): void {
  const prior = getCookie(c, SESSION_COOKIE)
  if (prior) db.delete(sessions).where(eq(sessions.id, prior)).run()
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  db.insert(sessions)
    .values({
      id: token,
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + ttlMs,
    })
    .run()
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'Lax',
    path: '/',
    maxAge: ttlMs / 1000,
  })
}

/** Resolve the authenticated user from the session cookie, or null. */
export function currentUser(c: Context): User | null {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const session = db.select().from(sessions).where(eq(sessions.id, token)).get()
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    db.delete(sessions).where(eq(sessions.id, token)).run()
    return null
  }
  const user = db.select().from(users).where(eq(users.id, session.userId)).get()
  return user ? toUser(user) : null
}

/** Destroy the current session and clear the cookie. */
export function endSession(c: Context): void {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) db.delete(sessions).where(eq(sessions.id, token)).run()
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: SECURE_COOKIE })
}

/** Sign out everywhere: destroy every session for the user + clear this cookie. */
export function endAllSessions(c: Context, userId: string): void {
  db.delete(sessions).where(eq(sessions.userId, userId)).run()
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: SECURE_COOKIE })
}
