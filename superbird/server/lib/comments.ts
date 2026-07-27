import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/client'
import { comments } from '../db/schema'
import { randomId } from './ids'
import type { Comment, CommentAnchor, CommentCreateInput, CommentReply } from '../../shared/types'

// Editor-only comment threads. One row per pin; replies embedded as JSON. All
// queries are scoped by projectId (the caller passes the installed project's id).

type Row = typeof comments.$inferSelect

function rowToDTO(row: Row): Comment {
  return {
    id: row.id,
    pageId: row.pageId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    anchor: JSON.parse(row.anchor) as CommentAnchor,
    replies: JSON.parse(row.replies) as CommentReply[],
    resolved: row.resolved === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function getRow(projectId: string, id: string): Row | undefined {
  return db.select().from(comments).where(and(eq(comments.projectId, projectId), eq(comments.id, id))).get()
}

export function listComments(projectId: string): Comment[] {
  return db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(desc(comments.createdAt))
    .all()
    .map(rowToDTO)
}

export function createComment(
  projectId: string,
  author: { id: string; name: string },
  input: CommentCreateInput,
): Comment {
  const id = randomId('cmt')
  const now = new Date().toISOString()
  db.insert(comments)
    .values({
      id,
      projectId,
      pageId: input.pageId,
      authorId: author.id,
      authorName: author.name,
      body: input.body,
      anchor: JSON.stringify(input.anchor),
      replies: '[]',
      resolved: 0,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return rowToDTO(getRow(projectId, id)!)
}

// Patch resolve state and/or edit the top-level body. Returns the updated thread.
export function updateComment(
  projectId: string,
  id: string,
  patch: { resolved?: boolean; body?: string },
): Comment | null {
  const row = getRow(projectId, id)
  if (!row) return null
  const set: Partial<Row> = { updatedAt: new Date().toISOString() }
  if (patch.resolved !== undefined) set.resolved = patch.resolved ? 1 : 0
  if (patch.body !== undefined) set.body = patch.body
  db.update(comments).set(set).where(eq(comments.id, id)).run()
  return rowToDTO(getRow(projectId, id)!)
}

export function deleteComment(projectId: string, id: string): boolean {
  const res = db.delete(comments).where(and(eq(comments.projectId, projectId), eq(comments.id, id))).run()
  return res.changes > 0
}

export function addReply(
  projectId: string,
  id: string,
  author: { id: string; name: string },
  body: string,
): Comment | null {
  const row = getRow(projectId, id)
  if (!row) return null
  const replies = JSON.parse(row.replies) as CommentReply[]
  replies.push({ id: randomId('rep'), authorId: author.id, authorName: author.name, body, createdAt: new Date().toISOString() })
  db.update(comments)
    .set({ replies: JSON.stringify(replies), updatedAt: new Date().toISOString() })
    .where(eq(comments.id, id))
    .run()
  return rowToDTO(getRow(projectId, id)!)
}

export function removeReply(projectId: string, id: string, replyId: string): Comment | null {
  const row = getRow(projectId, id)
  if (!row) return null
  const replies = (JSON.parse(row.replies) as CommentReply[]).filter((r) => r.id !== replyId)
  db.update(comments)
    .set({ replies: JSON.stringify(replies), updatedAt: new Date().toISOString() })
    .where(eq(comments.id, id))
    .run()
  return rowToDTO(getRow(projectId, id)!)
}
