import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { db } from '../db/client'
import { customers, customerSessions } from '../db/schema'

// Customers are a SEPARATE identity space from admin `users`: different table,
// different cookie, different session store. Never mixed.
export const CUSTOMER_COOKIE = 'sb_customer'
const TTL_MS = 1000 * 60 * 60 * 24 * 30
const SECURE = process.env.NODE_ENV === 'production'

export interface Customer {
  id: string
  email: string
  name: string
  createdAt: string
}

export function toCustomer(row: typeof customers.$inferSelect): Customer {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt }
}

export function startCustomerSession(c: Context, customerId: string): void {
  const token = randomBytes(32).toString('hex')
  const now = Date.now()
  db.insert(customerSessions)
    .values({ id: token, customerId, createdAt: new Date(now).toISOString(), expiresAt: now + TTL_MS })
    .run()
  setCookie(c, CUSTOMER_COOKIE, token, { httpOnly: true, secure: SECURE, sameSite: 'Lax', path: '/', maxAge: TTL_MS / 1000 })
}

export function currentCustomer(c: Context): Customer | null {
  const token = getCookie(c, CUSTOMER_COOKIE)
  if (!token) return null
  const session = db.select().from(customerSessions).where(eq(customerSessions.id, token)).get()
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    db.delete(customerSessions).where(eq(customerSessions.id, token)).run()
    return null
  }
  const row = db.select().from(customers).where(eq(customers.id, session.customerId)).get()
  return row ? toCustomer(row) : null
}

export function endCustomerSession(c: Context): void {
  const token = getCookie(c, CUSTOMER_COOKIE)
  if (token) db.delete(customerSessions).where(eq(customerSessions.id, token)).run()
  deleteCookie(c, CUSTOMER_COOKIE, { path: '/', secure: SECURE })
}
