import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import { requireAuth, currentUser } from '../lib/session'
import {
  generateSecret,
  otpauthUri,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
  consumeRecoveryCode,
} from '../lib/totp'
import { hit, clientIp } from '../lib/rateLimit'
import type { TwoFactorSetup, TwoFactorEnableResult } from '../../shared/types'

// TOTP enrollment for the signed-in admin. All routes require a session.
const twoFactor = new Hono()
twoFactor.use('*', requireAuth)

// Begin enrollment: mint a pending secret (stored but not yet enabled) and hand
// back the base32 secret + otpauth URI for manual entry into an authenticator.
twoFactor.post('/2fa/setup', (c) => {
  const me = currentUser(c)!
  const secret = generateSecret()
  db.update(users).set({ totpSecret: secret, totpEnabled: 0 }).where(eq(users.id, me.id)).run()
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
  if (!row?.totpSecret) return c.json({ error: 'Start setup first.' }, 400)
  if (row.totpEnabled === 1) return c.json({ error: 'Two-factor is already on.' }, 409)
  if (!verifyTotp(row.totpSecret, String(code ?? '').trim())) {
    return c.json({ error: 'Incorrect code. Check your authenticator and try again.' }, 400)
  }

  const recoveryCodes = generateRecoveryCodes(8)
  const hashes = recoveryCodes.map(hashRecoveryCode)
  db.update(users).set({ totpEnabled: 1, totpRecovery: JSON.stringify(hashes) }).where(eq(users.id, me.id)).run()
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

  db.update(users).set({ totpSecret: null, totpEnabled: 0, totpRecovery: null }).where(eq(users.id, me.id)).run()
  return c.json({ ok: true })
})

export default twoFactor
