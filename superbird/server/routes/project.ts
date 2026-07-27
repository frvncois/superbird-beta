import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { projectState } from '../db/schema'
import { requireAuth } from '../lib/session'
import { hit, clientIp } from '../lib/rateLimit'
import { getInstalledProject, publishDesign, setWorkingDocument } from '../lib/project'
import { maybeAutoBackup } from '../lib/backup'
import type { ProjectDocument, PublishResult } from '../../shared/types'

const project = new Hono()

// All project routes require an authenticated admin.
project.use('*', requireAuth)

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
  // Generous cap — well above the client's 800ms-debounced autosave — as an
  // abuse backstop for a hijacked session (keyed on the real socket peer).
  const lim = hit(`project-save:${clientIp(c)}`, 300, 60_000)
  if (!lim.ok) return c.json({ error: 'Too many requests.' }, 429, { 'Retry-After': String(lim.retryAfter) })
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as ProjectDocument
  // Persists + keeps the working-doc cache coherent (avoids a re-parse on read).
  setWorkingDocument(proj.id, body)
  // Lazily take an automatic backup (at most once/day; prunes old autos).
  maybeAutoBackup(proj.id)
  return c.json({ ok: true })
})

// Publish: snapshot the working design into the published slot (the public
// site serves the published design + live published entries).
project.post('/publish', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const publishedAt = publishDesign(proj.id)
  if (!publishedAt) return c.json({ error: 'Nothing to publish yet.' }, 400)
  return c.json({ publishedAt } satisfies PublishResult)
})

export default project
