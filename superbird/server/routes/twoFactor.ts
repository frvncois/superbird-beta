import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { requireAuth, currentUser } from '../lib/session'
import {
  generateSecret,
  otpauthUri,
  verifyTotp,
  verifyTotpStep,
  generateRecoveryCodes,
  hashRecoveryCode,
  consumeRecoveryCode,
} from '../lib/totp'
import { hit, clientIp } from '../lib/rateLimit'
import type { TwoFactorSetup, TwoFactorEnableResult } from '../../shared/types'

// TOTP enrollment for the signed-in admin. All routes require a session.
const twoFactor = new Hono()
twoFactor.use('*', requireAuth)

// Begin enrollment: stage a PENDING secret (never touches the active secret or
// the enabled flag) and hand back the base32 secret + otpauth URI. Re-enrolling
// while 2FA is already on requires a current code, so a session without the
// device can't quietly rotate 2FA to an attacker's authenticator.
twoFactor.post('/2fa/setup', async (c) => {
  const me = currentUser(c)!
  const row = db.select().from(users).where(eq(users.id, me.id)).get()
  if (!row) return c.json({ error: 'Not found.' }, 404)

  if (row.totpEnabled === 1) {
    const lim = hit(`2fa-setup:${me.id}`, 10, 5 * 60_000)
    if (!lim.ok) return c.json({ error: 'Too many attempts. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })
    const { code } = (await c.req.json().catch(() => ({}))) as { code?: string }
    if (!row.totpSecret || !verifyTotp(row.totpSecret, String(code ?? '').trim())) {
      return c.json({ error: 'Enter a current code to re-enroll two-factor.' }, 400)
    }
  }

  const secret = generateSecret()
  db.update(users).set({ totpPendingSecret: secret }).where(eq(users.id, me.id)).run()
  return c.json({ secret, otpauthUri: otpauthUri(secret, me.email, 'Superbird') } satisfies TwoFactorSetup)
})

// Confirm a code from the app → enable 2FA and return one-time recovery codes
// (shown exactly once; only their hashes are stored).
twoFactor.post('/2fa/enable', async (c) => {
  const me = currentUser(c)!
  const lim = hit(`2fa-enable:${me.id}`, 10, 5 * 60_000)
  if (!lim.ok) return c.json({ error: 'Too many attempts. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })

  const { code } = (await c.req.json()) as { code?: string }
  const row = db.select().from(users).where(eq(users.id, me.id)).get()
  // Verify against the PENDING secret, then promote it to active. Works for a
  // first enrollment and for a re-enroll (which replaces the active secret +
  // issues fresh recovery codes). No pending secret ⇒ setup wasn't started.
  if (!row?.totpPendingSecret) return c.json({ error: 'Start setup first.' }, 400)
  const step = verifyTotpStep(row.totpPendingSecret, String(code ?? '').trim())
  if (step === null) {
    return c.json({ error: 'Incorrect code. Check your authenticator and try again.' }, 400)
  }

  const recoveryCodes = generateRecoveryCodes(8)
  const hashes = recoveryCodes.map(hashRecoveryCode)
  db.update(users)
    .set({
      totpSecret: row.totpPendingSecret,
      totpEnabled: 1,
      totpRecovery: JSON.stringify(hashes),
      totpPendingSecret: null,
      totpLastStep: step, // this code is now spent — can't be replayed at login
    })
    .where(eq(users.id, me.id))
    .run()
  return c.json({ recoveryCodes } satisfies TwoFactorEnableResult)
})

// Turn 2FA off — requires a current TOTP or recovery code (an idle session
// alone can't strip the protection).
twoFactor.post('/2fa/disable', async (c) => {
  const me = currentUser(c)!
  const lim = hit(`2fa-disable:${me.id}`, 10, 5 * 60_000)
  if (!lim.ok) return c.json({ error: 'Too many attempts. Try again shortly.' }, 429, { 'Retry-After': String(lim.retryAfter) })

  const { code } = (await c.req.json()) as { code?: string }
  const row = db.select().from(users).where(eq(users.id, me.id)).get()
  if (!row || row.totpEnabled !== 1 || !row.totpSecret) return c.json({ error: 'Two-factor isn’t enabled.' }, 400)

  const codeStr = String(code ?? '').trim()
  const hashes: string[] = row.totpRecovery ? (JSON.parse(row.totpRecovery) as string[]) : []
  const ok = verifyTotp(row.totpSecret, codeStr) || consumeRecoveryCode(hashes, codeStr) !== null
  if (!ok) return c.json({ error: 'Incorrect code.' }, 400)

  db.update(users)
    .set({ totpSecret: null, totpEnabled: 0, totpRecovery: null, totpPendingSecret: null, totpLastStep: null })
    .where(eq(users.id, me.id))
    .run()
  return c.json({ ok: true })
})

export default twoFactor
