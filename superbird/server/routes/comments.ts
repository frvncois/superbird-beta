import { Hono } from 'hono'
import { requireAuth, currentUser } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  addReply,
  removeReply,
} from '../lib/comments'
import type { CommentAnchor, CommentCreateInput } from '../../shared/types'

const comments = new Hono()

// Editor-only collaboration surface: logged-in users only.
comments.use('*', requireAuth)

function isAnchor(a: unknown): a is CommentAnchor {
  return !!a && typeof a === 'object'
    && typeof (a as CommentAnchor).nodeId === 'string'
    && typeof (a as CommentAnchor).nx === 'number'
    && typeof (a as CommentAnchor).ny === 'number'
}

comments.get('/comments', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ items: listComments(proj.id) })
})

comments.post('/comments', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const user = currentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = (await c.req.json().catch(() => ({}))) as Partial<CommentCreateInput>
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return c.json({ error: 'Comment body is required.' }, 400)
  if (typeof body.pageId !== 'string' || !body.pageId) return c.json({ error: 'pageId is required.' }, 400)
  if (!isAnchor(body.anchor)) return c.json({ error: 'A valid anchor is required.' }, 400)

  const created = createComment(proj.id, user, { pageId: body.pageId, anchor: body.anchor, body: text })
  return c.json(created, 201)
})

comments.patch('/comments/:id', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json().catch(() => ({}))) as { resolved?: boolean; body?: string }
  const patch: { resolved?: boolean; body?: string } = {}
  if (typeof body.resolved === 'boolean') patch.resolved = body.resolved
  if (typeof body.body === 'string' && body.body.trim()) patch.body = body.body.trim()
  const updated = updateComment(proj.id, c.req.param('id'), patch)
  if (!updated) return c.json({ error: 'Comment not found.' }, 404)
  return c.json(updated)
})

comments.delete('/comments/:id', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const ok = deleteComment(proj.id, c.req.param('id'))
  if (!ok) return c.json({ error: 'Comment not found.' }, 404)
  return c.json({ ok: true })
})

comments.post('/comments/:id/replies', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const user = currentUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  const body = (await c.req.json().catch(() => ({}))) as { body?: string }
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return c.json({ error: 'Reply body is required.' }, 400)
  const updated = addReply(proj.id, c.req.param('id'), user, text)
  if (!updated) return c.json({ error: 'Comment not found.' }, 404)
  return c.json(updated)
})

comments.delete('/comments/:id/replies/:replyId', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const updated = removeReply(proj.id, c.req.param('id'), c.req.param('replyId'))
  if (!updated) return c.json({ error: 'Comment not found.' }, 404)
  return c.json(updated)
})

export default comments
