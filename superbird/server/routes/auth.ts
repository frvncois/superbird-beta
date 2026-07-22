import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projects, users } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/password'
import { startSession, endSession, currentUser, toUser } from '../lib/session'
import { getPublishedAt } from '../lib/project'
import { randomId } from '../lib/ids'
import type {
  SetupPayload,
  LoginPayload,
  InstallResult,
  SessionState,
  Project,
} from '../../shared/types'

const auth = new Hono()

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
  }
  return c.json(state)
})

// First-run install: create the project + admin user, open a session.
auth.post('/install', async (c) => {
  if (getProject()) return c.json({ error: 'Already installed.' }, 409)

  const body = (await c.req.json()) as SetupPayload
  const name = body.project?.name?.trim()
  const handle = body.project?.handle?.trim()
  const admin = body.admin
  if (!name || !handle || !admin?.name?.trim() || !admin?.email?.trim() || !admin?.password) {
    return c.json({ error: 'Missing required fields.' }, 400)
  }

  const now = new Date().toISOString()
  const project: Project = { id: randomId('proj'), name, handle, createdAt: now }
  const userId = randomId('user')

  db.insert(projects).values(project).run()
  db.insert(users)
    .values({
      id: userId,
      name: admin.name.trim(),
      email: admin.email.trim().toLowerCase(),
      role: 'admin',
      passwordHash: hashPassword(admin.password),
      createdAt: now,
    })
    .run()

  startSession(c, userId)

  const result: InstallResult = {
    project,
    user: { id: userId, name: admin.name.trim(), email: admin.email.trim().toLowerCase(), role: 'admin', createdAt: now },
  }
  return c.json(result, 201)
})

// Sign in.
auth.post('/login', async (c) => {
  const body = (await c.req.json()) as LoginPayload
  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password) return c.json({ error: 'Missing credentials.' }, 400)

  const row = db.select().from(users).where(eq(users.email, email)).get()
  if (!row || !verifyPassword(password, row.passwordHash)) {
    return c.json({ error: 'Incorrect email or password.' }, 401)
  }

  startSession(c, row.id)
  return c.json({ user: toUser(row) })
})

// Sign out.
auth.post('/logout', (c) => {
  endSession(c)
  return c.json({ ok: true })
})

export default auth
