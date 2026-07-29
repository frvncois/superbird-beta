import { Hono } from 'hono'
import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects, users } from '../db/schema'
import { verifyTotpStep, consumeRecoveryCode } from '../lib/totp'
import { hashPassword, verifyPassword, validatePassword, DUMMY_HASH_PROMISE } from '../lib/password'
import {
  startSession,
  endSession,
  endAllSessions,
  currentUser,
  toUser,
  requireAuth,
  SESSION_TTL_SHORT_MS,
  SESSION_TTL_LONG_MS,
} from '../lib/session'
import { adminIpAllowed } from '../lib/ipAllow'
import { getPublishedAt, getDraftSavedAt } from '../lib/project'
import { randomId } from '../lib/ids'
import { hit, clientIp } from '../lib/rateLimit'
import type {
  SetupPayload,
  LoginPayload,
  InstallResult,
  SessionState,
  Project,
  LoginResult,
} from '../../shared/types'

const auth = new Hono()

// Short-lived pending 2FA logins: password verified, awaiting the TOTP/recovery
// code. In-memory (single process); the opaque token is the only handle.
interface TwoFactorChallenge {
  userId: string
  remember: boolean
  attempts: number
  expiresAt: number
}
const challenges = new Map<string, TwoFactorChallenge>()
const CHALLENGE_TTL_MS = 5 * 60_000

function newChallenge(userId: string, remember: boolean): string {
  const token = randomBytes(32).toString('hex')
  challenges.set(token, { userId, remember, attempts: 0, expiresAt: Date.now() + CHALLENGE_TTL_MS })
  return token
}
// Evict expired challenges so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [k, ch] of challenges) if (ch.expiresAt <= now) challenges.delete(k)
}, 60_000).unref?.()

function getProject(): Project | null {
  const row = db.select().from(projects).limit(1).get()
  return row ?? null
}

// Boot state: installed? + project + current user. One call on app startup.
auth.get('/session', (c) => {
  const project = getProject()
  const state: SessionState = {
    installed: project !== null,
    project,
    user: currentUser(c),
    publishedAt: project ? getPublishedAt(project.id) : null,
    draftSavedAt: project ? getDraftSavedAt(project.id) : null,
  }
  return c.json(state)
})

// First-run install: create the project + admin user, open a session.
auth.post('/install', async (c) => {
  if (!adminIpAllowed(c)) return c.json({ error: 'Forbidden' }, 403)
  // Blunt the one-shot install endpoint against automated hammering pre-setup.
  const installLimit = hit(`install:${clientIp(c)}`, 5, 60_000)
  if (!installLimit.ok) return c.json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(installLimit.retryAfter) })
  if (getProject()) return c.json({ error: 'Already installed.' }, 409)

  const body = (await c.req.json()) as SetupPayload
  const name = body.project?.name?.trim()
  const handle = body.project?.handle?.trim()
  const admin = body.admin
  if (!name || !handle || !admin?.name?.trim() || !admin?.email?.trim() || !admin?.password) {
    return c.json({ error: 'Missing required fields.' }, 400)
  }
  const pwErr = validatePassword(admin.password)
  if (pwErr) return c.json({ error: pwErr }, 400)

  const now = new Date().toISOString()
  const project: Project = { id: randomId('proj'), name, handle, createdAt: now }
  const userId = randomId('user')
  const passwordHash = await hashPassword(admin.password)

  // Close the check-then-act race: re-check + both inserts run atomically in one
  // transaction, so two concurrent pre-install requests can't both seat an admin
  // (the second sees the project and rolls back). Also keeps project+user
  // all-or-nothing.
  try {
    db.transaction(() => {
      if (getProject()) {
        const e = new Error('installed') as Error & { code?: string }
        e.code = 'INSTALLED'
        throw e
      }
      db.insert(projects).values(project).run()
      db.insert(users)
        .values({
          id: userId,
          name: admin.name.trim(),
          email: admin.email.trim().toLowerCase(),
          role: 'admin',
          passwordHash,
          createdAt: now,
        })
        .run()
    })
  } catch (e) {
    if ((e as { code?: string })?.code === 'INSTALLED') return c.json({ error: 'Already installed.' }, 409)
    throw e // real DB error → global 500 handler
  }

  startSession(c, userId)

  const result: InstallResult = {
    project,
    user: { id: userId, name: admin.name.trim(), email: admin.email.trim().toLowerCase(), role: 'admin', createdAt: now, twoFactorEnabled: false },
  }
  return c.json(result, 201)
})

// Sign in.
auth.post('/login', async (c) => {
  if (!adminIpAllowed(c)) return c.json({ error: 'Forbidden' }, 403)
  const body = (await c.req.json()) as LoginPayload
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password) return c.json({ error: 'Missing credentials.' }, 400)

  // Rate limit brute-force: per-IP (all accounts) + per-account (targeted).
  const ip = clientIp(c)
  const ipLimit = hit(`login:ip:${ip}`, 30, 5 * 60_000)
  const emailLimit = hit(`login:email:${email}`, 10, 15 * 60_000)
  if (!ipLimit.ok || !emailLimit.ok) {
    const retry = Math.max(ipLimit.retryAfter, emailLimit.retryAfter)
    return c.json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(retry) })
  }

  const row = db.select().from(users).where(eq(users.email, email)).get()
  // Always run a real scrypt (against a startup-computed dummy hash if the user
  // doesn't exist) so the response time doesn't reveal whether the email is
  // registered. Async → the hash runs on the threadpool, not the event loop.
  let valid: boolean
  if (row) {
    valid = await verifyPassword(password, row.passwordHash)
  } else {
    await verifyPassword(password, await DUMMY_HASH_PROMISE)
    valid = false
  }
  if (!row || !valid) {
    return c.json({ error: 'Incorrect email or password.' }, 401)
  }

  // 2FA gate: don't open a session yet — hand back a challenge to complete.
  if (row.totpEnabled === 1) {
    const challenge = newChallenge(row.id, !!body.remember)
    return c.json({ twoFactorRequired: true, challenge } satisfies LoginResult)
  }

  startSession(c, row.id, body.remember ? SESSION_TTL_LONG_MS : SESSION_TTL_SHORT_MS)
  return c.json({ user: toUser(row) } satisfies LoginResult)
})

// Login step 2 — complete a 2FA challenge with a TOTP or recovery code.
auth.post('/login/2fa', async (c) => {
  if (!adminIpAllowed(c)) return c.json({ error: 'Forbidden' }, 403)
  const body = (await c.req.json()) as { challenge?: string; code?: string }
  const token = body.challenge ?? ''
  const ch = token ? challenges.get(token) : undefined
  if (!ch || ch.expiresAt < Date.now()) {
    if (ch) challenges.delete(token)
    return c.json({ error: 'Your sign-in expired. Please start again.' }, 401)
  }
  // Bound guessing: 5 tries per challenge, then it's burned.
  ch.attempts++
  if (ch.attempts > 5) {
    challenges.delete(token)
    return c.json({ error: 'Too many attempts. Please sign in again.' }, 429)
  }

  const row = db.select().from(users).where(eq(users.id, ch.userId)).get()
  if (!row || row.totpEnabled !== 1 || !row.totpSecret) {
    challenges.delete(token)
    return c.json({ error: 'Please sign in again.' }, 401)
  }

  const code = String(body.code ?? '').trim()
  let valid = false
  const step = verifyTotpStep(row.totpSecret, code)
  if (step !== null) {
    // Replay guard: reject a code from a step already accepted for this user
    // (the same 6 digits stay valid for the whole ±window otherwise).
    if (step <= (row.totpLastStep ?? -1)) return c.json({ error: 'Invalid code.' }, 401)
    valid = true
    db.update(users).set({ totpLastStep: step }).where(eq(users.id, row.id)).run()
  } else {
    // Fall back to a single-use recovery code.
    const hashes: string[] = row.totpRecovery ? (JSON.parse(row.totpRecovery) as string[]) : []
    const remaining = consumeRecoveryCode(hashes, code)
    if (remaining) {
      valid = true
      db.update(users).set({ totpRecovery: JSON.stringify(remaining) }).where(eq(users.id, row.id)).run()
    }
  }
  if (!valid) return c.json({ error: 'Invalid code.' }, 401) // keep challenge for remaining tries

  challenges.delete(token)
  startSession(c, row.id, ch.remember ? SESSION_TTL_LONG_MS : SESSION_TTL_SHORT_MS)
  return c.json({ user: toUser(row) } satisfies LoginResult)
})

// Sign out (this device).
auth.post('/logout', (c) => {
  endSession(c)
  return c.json({ ok: true })
})

// Sign out everywhere — revoke every session for the current user.
auth.post('/logout-all', requireAuth, (c) => {
  const me = currentUser(c)
  if (me) endAllSessions(c, me.id)
  return c.json({ ok: true })
})

export default auth
