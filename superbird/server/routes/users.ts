import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users, sessions } from '../db/schema'
import { hashPassword, validatePassword } from '../lib/password'
import { currentUser, requireAuth, toUser } from '../lib/session'
import { randomId } from '../lib/ids'

const usersApi = new Hono()

// All user-management routes require an authenticated user.
usersApi.use('*', requireAuth)

// List everyone who can sign in (never exposes password hashes).
usersApi.get('/users', (c) => {
  const rows = db.select().from(users).all()
  return c.json({ users: rows.map(toUser) })
})

// Add a user with an initial password (no email/invite system yet).
usersApi.post('/users', async (c) => {
  const body = (await c.req.json()) as { name?: string; email?: string; password?: string }
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!name || !email || !password) return c.json({ error: 'Name, email and password are required.' }, 400)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'Enter a valid email.' }, 400)
  const pwErr = validatePassword(password)
  if (pwErr) return c.json({ error: pwErr }, 400)

  const existing = db.select().from(users).where(eq(users.email, email)).get()
  if (existing) return c.json({ error: 'A user with that email already exists.' }, 409)

  const row = {
    id: randomId('user'),
    name,
    email,
    role: 'admin',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  try {
    db.insert(users).values(row).run()
  } catch {
    // UNIQUE(email) — a racing create beat us between the check and the insert.
    return c.json({ error: 'A user with that email already exists.' }, 409)
  }
  return c.json(toUser(row), 201)
})

// Remove a user. Can't remove yourself or the last remaining user.
usersApi.delete('/users/:id', (c) => {
  const id = c.req.param('id')
  const me = currentUser(c)
  if (me && me.id === id) return c.json({ error: 'You can’t remove yourself.' }, 400)

  const all = db.select().from(users).all()
  if (!all.some((u) => u.id === id)) return c.json({ error: 'User not found.' }, 404)
  if (all.length <= 1) return c.json({ error: 'Can’t remove the last user.' }, 400)

  // Drop their sessions first (FK), then the user.
  db.delete(sessions).where(eq(sessions.userId, id)).run()
  db.delete(users).where(eq(users.id, id)).run()
  return c.json({ ok: true })
})

export default usersApi
