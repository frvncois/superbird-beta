import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projectState } from '../db/schema'
import { currentUser } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import type { ProjectDocument } from '../../shared/types'

const project = new Hono()

// All project routes require an authenticated admin.
project.use('*', async (c, next) => {
  if (!currentUser(c)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

const EMPTY: ProjectDocument = {
  design: null,
  content: { collections: [], entries: [] },
}

// Load the whole project document. Fresh projects return { design: null } so
// the client knows to seed from demo and save.
project.get('/project', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const row = db.select().from(projectState).where(eq(projectState.projectId, proj.id)).get()
  if (!row) return c.json(EMPTY)
  return c.json(JSON.parse(row.document) as ProjectDocument)
})

// Save (upsert) the whole project document.
project.put('/project', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as ProjectDocument
  const now = new Date().toISOString()
  db.insert(projectState)
    .values({ projectId: proj.id, document: JSON.stringify(body), updatedAt: now })
    .onConflictDoUpdate({
      target: projectState.projectId,
      set: { document: JSON.stringify(body), updatedAt: now },
    })
    .run()
  return c.json({ ok: true })
})

export default project
