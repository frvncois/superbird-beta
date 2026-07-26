import { eq, and, gte, lte, like, desc, or } from 'drizzle-orm'
import { db } from '../db/client'
import { submissions } from '../db/schema'
import { randomId } from './ids'
import { getWorkingDocument } from './project'
import type { CanvasNode, FormConfig, Page } from '@/types/canvas'

export type EmailStatus = 'skipped' | 'sent' | 'failed'

export interface SubmissionDTO {
  id: string
  formId: string
  formName: string
  data: Record<string, string>
  pageUrl?: string
  ip?: string
  seen: boolean
  emailStatus: EmailStatus
  emailedTo?: string
  createdAt: string
}

type Row = typeof submissions.$inferSelect

function rowToDTO(row: Row): SubmissionDTO {
  return {
    id: row.id,
    formId: row.formId,
    formName: row.formName,
    data: JSON.parse(row.data) as Record<string, string>,
    pageUrl: row.pageUrl ?? undefined,
    ip: row.ip ?? undefined,
    seen: row.seen === 1,
    emailStatus: row.emailStatus as EmailStatus,
    emailedTo: row.emailedTo ?? undefined,
    createdAt: row.createdAt,
  }
}

// ── Form resolution (validates the form exists + reads its config) ──

function findFormNode(node: CanvasNode, formId: string): CanvasNode | null {
  if (node.type === 'form' && node.id === formId) return node
  for (const child of node.children ?? []) {
    const found = findFormNode(child, formId)
    if (found) return found
  }
  return null
}

export interface ResolvedForm {
  name: string
  config: FormConfig
}

// A form the visitor submits must actually exist in the working document — this
// blocks junk POSTs against arbitrary ids. Config defaults to save-to-DB on.
export function resolveForm(projectId: string, formId: string): ResolvedForm | null {
  const doc = getWorkingDocument(projectId)
  const design = doc?.design as { pages?: Page[]; siteSettings?: { forms?: Record<string, FormConfig> } } | undefined
  if (!design?.pages) return null

  let node: CanvasNode | null = null
  for (const page of design.pages) {
    if (page.body) node = findFormNode(page.body, formId)
    if (node) break
  }
  if (!node) return null

  const config: FormConfig = design.siteSettings?.forms?.[formId] ?? { saveToDb: true }
  const name = config.name || (node.props?.name as string | undefined) || 'Form'
  return { name, config }
}

// ── CRUD ──

export function createSubmission(
  projectId: string,
  input: {
    formId: string
    formName: string
    data: Record<string, string>
    pageUrl?: string
    ip?: string
    emailStatus?: EmailStatus
    emailedTo?: string
  },
): SubmissionDTO {
  const id = randomId('sub')
  const now = new Date().toISOString()
  db.insert(submissions)
    .values({
      id,
      projectId,
      formId: input.formId,
      formName: input.formName,
      data: JSON.stringify(input.data),
      pageUrl: input.pageUrl ?? null,
      ip: input.ip ?? null,
      seen: 0,
      emailStatus: input.emailStatus ?? 'skipped',
      emailedTo: input.emailedTo ?? null,
      createdAt: now,
    })
    .run()
  return rowToDTO(db.select().from(submissions).where(eq(submissions.id, id)).get()!)
}

export interface SubmissionFilters {
  formId?: string
  status?: 'unread' | 'sent' | 'seen'
  from?: string // ISO date (inclusive)
  to?: string // ISO date (inclusive)
  search?: string
}

function whereFor(projectId: string, f: SubmissionFilters) {
  const conds = [eq(submissions.projectId, projectId)]
  if (f.formId) conds.push(eq(submissions.formId, f.formId))
  if (f.status === 'seen') conds.push(eq(submissions.seen, 1))
  if (f.status === 'sent') conds.push(and(eq(submissions.seen, 0), eq(submissions.emailStatus, 'sent'))!)
  if (f.status === 'unread') {
    conds.push(and(eq(submissions.seen, 0), or(eq(submissions.emailStatus, 'skipped'), eq(submissions.emailStatus, 'failed'))!)!)
  }
  if (f.from) conds.push(gte(submissions.createdAt, f.from))
  if (f.to) conds.push(lte(submissions.createdAt, f.to))
  if (f.search) {
    const q = `%${f.search}%`
    conds.push(or(like(submissions.data, q), like(submissions.formName, q))!)
  }
  return and(...conds)
}

// Filtered + newest-first. Returns everything matching; the client paginates.
export function listSubmissions(projectId: string, filters: SubmissionFilters = {}): SubmissionDTO[] {
  return db
    .select()
    .from(submissions)
    .where(whereFor(projectId, filters))
    .orderBy(desc(submissions.createdAt))
    .all()
    .map(rowToDTO)
}

// Distinct forms that actually have submissions (for the filter dropdown).
export function listSubmittedForms(projectId: string): { formId: string; formName: string; count: number }[] {
  const rows = db.select().from(submissions).where(eq(submissions.projectId, projectId)).all()
  const map = new Map<string, { formId: string; formName: string; count: number }>()
  for (const r of rows) {
    const e = map.get(r.formId) ?? { formId: r.formId, formName: r.formName, count: 0 }
    e.formName = r.formName // keep the latest name
    e.count++
    map.set(r.formId, e)
  }
  return [...map.values()].sort((a, b) => a.formName.localeCompare(b.formName))
}

// ── Export ──

function deriveStatus(s: SubmissionDTO): string {
  if (s.seen) return 'seen'
  return s.emailStatus === 'sent' ? 'sent' : 'unread'
}

export function buildSubmissionsJson(rows: SubmissionDTO[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      form: r.formName,
      receivedAt: r.createdAt,
      page: r.pageUrl ?? null,
      status: deriveStatus(r),
      emailedTo: r.emailedTo ?? null,
      data: r.data,
    })),
    null,
    2,
  )
}

export function buildSubmissionsCsv(rows: SubmissionDTO[]): string {
  // Field columns = the union of every submission's keys (forms can differ).
  const fieldKeys = [...new Set(rows.flatMap((r) => Object.keys(r.data)))]
  const headers = ['Received', 'Form', 'Page', 'Status', ...fieldKeys]
  const esc = (v: unknown): string => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(esc).join(',')]
  for (const r of rows) {
    const row = [r.createdAt, r.formName, r.pageUrl ?? '', deriveStatus(r), ...fieldKeys.map((k) => r.data[k] ?? '')]
    lines.push(row.map(esc).join(','))
  }
  // BOM so Excel reads UTF-8 correctly.
  return '﻿' + lines.join('\r\n')
}

export function markSeen(id: string): void {
  db.update(submissions).set({ seen: 1 }).where(eq(submissions.id, id)).run()
}

export function deleteSubmission(id: string): void {
  db.delete(submissions).where(eq(submissions.id, id)).run()
}
