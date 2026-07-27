import nodemailer from 'nodemailer'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { smtpConfig } from '../db/schema'
import { assertPublicHost } from './safeFetch'

type Row = typeof smtpConfig.$inferSelect

export interface SmtpPatch {
  host?: string
  port?: number
  secure?: boolean
  username?: string
  password?: string
  fromEmail?: string
  fromName?: string
}

// Client-facing shape: never includes the password (only whether one is set).
export interface SmtpConfigClient {
  host: string
  port: number
  secure: boolean
  username: string
  fromEmail: string
  fromName: string
  hasPassword: boolean
}

function getRow(projectId: string): Row | undefined {
  return db.select().from(smtpConfig).where(eq(smtpConfig.projectId, projectId)).get()
}

export function getSmtpConfigForClient(projectId: string): SmtpConfigClient {
  const r = getRow(projectId)
  return {
    host: r?.host ?? '',
    port: r?.port ?? 587,
    secure: r?.secure === 1,
    username: r?.username ?? '',
    fromEmail: r?.fromEmail ?? '',
    fromName: r?.fromName ?? '',
    hasPassword: !!r?.password,
  }
}

// Upsert. The password is write-only: an omitted/blank password keeps the
// stored one (so the UI never has to round-trip the secret).
export function setSmtpConfig(projectId: string, patch: SmtpPatch): void {
  const existing = getRow(projectId)
  const password = patch.password ? patch.password : existing?.password ?? ''
  const values = {
    projectId,
    host: patch.host ?? existing?.host ?? '',
    port: patch.port ?? existing?.port ?? 587,
    secure: (patch.secure ?? existing?.secure === 1) ? 1 : 0,
    username: patch.username ?? existing?.username ?? '',
    password,
    fromEmail: patch.fromEmail ?? existing?.fromEmail ?? '',
    fromName: patch.fromName ?? existing?.fromName ?? '',
    updatedAt: new Date().toISOString(),
  }
  db.insert(smtpConfig)
    .values(values)
    .onConflictDoUpdate({ target: smtpConfig.projectId, set: values })
    .run()
}

export function isSmtpConfigured(projectId: string): boolean {
  const r = getRow(projectId)
  return !!(r?.host && r?.fromEmail)
}

function transportFor(row: Row) {
  return nodemailer.createTransport({
    host: row.host,
    port: row.port,
    secure: row.secure === 1,
    auth: row.username ? { user: row.username, pass: row.password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}

export interface SendResult {
  ok: boolean
  error?: string
}

export async function sendMail(
  projectId: string,
  msg: { to: string; subject: string; text: string; html?: string },
): Promise<SendResult> {
  const row = getRow(projectId)
  if (!row?.host || !row?.fromEmail) return { ok: false, error: 'SMTP is not configured.' }
  // SSRF guard: refuse to connect to an internal/loopback/metadata host — "send
  // test email" is otherwise a probe primitive. (Same DNS-rebinding residual as
  // the webhook guard; nodemailer re-resolves at connect. See docs/security.md.)
  try {
    await assertPublicHost(row.host)
  } catch {
    return { ok: false, error: 'SMTP host is not allowed (must be a public address).' }
  }
  try {
    const from = row.fromName ? `"${row.fromName}" <${row.fromEmail}>` : row.fromEmail
    await transportFor(row).sendMail({ from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed.' }
  }
}

// Compose + send a submission notification. Returns the delivery result.
export function sendSubmissionEmail(
  projectId: string,
  to: string,
  formName: string,
  data: Record<string, string>,
  pageUrl?: string,
): Promise<SendResult> {
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`)
  const text = `New submission from "${formName}"\n\n${lines.join('\n')}${pageUrl ? `\n\nPage: ${pageUrl}` : ''}`
  const rows = Object.entries(data)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join('')
  const html = `<div style="font-family:system-ui,sans-serif"><h2 style="font-size:16px">New submission — ${escapeHtml(formName)}</h2><table style="border-collapse:collapse;font-size:14px">${rows}</table>${pageUrl ? `<p style="color:#64748b;font-size:12px">Page: ${escapeHtml(pageUrl)}</p>` : ''}</div>`
  return sendMail(projectId, { to, subject: `New submission: ${formName}`, text, html })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}
