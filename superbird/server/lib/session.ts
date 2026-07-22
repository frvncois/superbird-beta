import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'
import type { User } from '../../shared/types'

export const SESSION_COOKIE = 'sb_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: 'admin',
    createdAt: row.createdAt,
  }
}

/** Create a session for a user and set the cookie. */
export function startSession(c: Context, userId: string): void {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  db.insert(sessions)
    .values({
      id: token,
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + SESSION_TTL_MS,
    })
    .run()
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
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
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}
