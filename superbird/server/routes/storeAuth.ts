import { Hono } from 'hono'
import { getInstalledProject } from '../lib/project'
import { isStoreEnabled } from '../lib/store'
import { findCustomerByEmail, createCustomer, verifyCustomer } from '../lib/customers'
import { startCustomerSession, endCustomerSession, currentCustomer, toCustomer } from '../lib/customerSession'
import { validatePassword } from '../lib/password'
import { hit, clientIp } from '../lib/rateLimit'

// PUBLIC customer authentication for the storefront. Entirely separate from the
// admin auth routes — different tables, cookie, and rate-limit buckets.
const storeAuth = new Hono()

function requireStore(): { id: string } | null {
  const proj = getInstalledProject()
  if (!proj || !isStoreEnabled(proj.id)) return null
  return proj
}

storeAuth.get('/store/auth/session', (c) => {
  return c.json({ customer: currentCustomer(c) })
})

storeAuth.post('/store/auth/register', async (c) => {
  const proj = requireStore()
  if (!proj) return c.json({ error: 'Store unavailable.' }, 409)
  const regLimit = hit(`custreg:${clientIp(c)}`, 10, 15 * 60_000)
  if (!regLimit.ok) return c.json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(regLimit.retryAfter) })

  const { email, name, password } = (await c.req.json().catch(() => ({}))) as { email?: string; name?: string; password?: string }
  const addr = email?.trim().toLowerCase()
  if (!addr || !password) return c.json({ error: 'Email and password are required.' }, 400)
  const pwErr = validatePassword(password)
  if (pwErr) return c.json({ error: pwErr }, 400)
  if (findCustomerByEmail(proj.id, addr)) return c.json({ error: 'An account with that email already exists.' }, 409)

  const row = createCustomer(proj.id, { email: addr, name: name?.trim(), password })
  startCustomerSession(c, row.id)
  return c.json({ customer: toCustomer(row) }, 201)
})

storeAuth.post('/store/auth/login', async (c) => {
  const proj = requireStore()
  if (!proj) return c.json({ error: 'Store unavailable.' }, 409)
  const ip = clientIp(c)
  const { email, password } = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string }
  const addr = email?.trim().toLowerCase() ?? ''
  // Per-IP and per-account limits (mirrors the admin login).
  const ipLimit = hit(`custlogin:ip:${ip}`, 30, 5 * 60_000)
  const acctLimit = addr ? hit(`custlogin:acct:${addr}`, 10, 15 * 60_000) : { ok: true, retryAfter: 0 }
  if (!ipLimit.ok || !acctLimit.ok) {
    const retry = Math.max(ipLimit.retryAfter, acctLimit.retryAfter)
    return c.json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(retry) })
  }

  const row = verifyCustomer(proj.id, addr, password ?? '')
  if (!row) return c.json({ error: 'Invalid email or password.' }, 401)
  startCustomerSession(c, row.id)
  return c.json({ customer: toCustomer(row) })
})

storeAuth.post('/store/auth/logout', (c) => {
  endCustomerSession(c)
  return c.json({ ok: true })
})

// GET logout so a plain "Log out" link works without JS → back to /login.
storeAuth.get('/store/auth/logout', (c) => {
  endCustomerSession(c)
  return c.redirect('/login')
})

export default storeAuth
