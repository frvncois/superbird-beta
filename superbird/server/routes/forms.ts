import { Hono, type Context } from 'hono'
import { requireAuth } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import {
  listSubmissions,
  listSubmittedForms,
  markSeen,
  deleteSubmission,
  buildSubmissionsCsv,
  buildSubmissionsJson,
  type SubmissionFilters,
} from '../lib/submissions'
import { getSmtpConfigForClient, setSmtpConfig, sendMail, type SmtpPatch } from '../lib/mailer'
import { currentUser } from '../lib/session'
import { hit, clientIp } from '../lib/rateLimit'

const forms = new Hono()

// Admin-only: submissions are private data.
forms.use('*', requireAuth)

function filtersFromQuery(c: Context): SubmissionFilters {
  const status = c.req.query('status')
  const to = c.req.query('to')
  return {
    formId: c.req.query('formId') || undefined,
    status: status === 'unread' || status === 'sent' || status === 'seen' ? status : undefined,
    from: c.req.query('from') || undefined,
    // A date-only `to` should include the whole day.
    to: to ? (to.length <= 10 ? `${to}T23:59:59.999Z` : to) : undefined,
    search: c.req.query('search') || undefined,
  }
}

forms.get('/forms/submissions', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ items: listSubmissions(proj.id, filtersFromQuery(c)) })
})

// Scoped export (CSV or JSON) as a downloadable attachment. Honors the same
// form/date filters. Rate-limited so it can't be hammered.
forms.get('/forms/submissions/export', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  if (!hit(`export:${clientIp(c)}`, 10, 60_000)) return c.json({ error: 'Too many exports. Try again shortly.' }, 429)

  const rows = listSubmissions(proj.id, filtersFromQuery(c))
  const json = c.req.query('format') === 'json'
  const date = new Date().toISOString().slice(0, 10)
  const body = json ? buildSubmissionsJson(rows) : buildSubmissionsCsv(rows)
  return new Response(body, {
    headers: {
      'Content-Type': json ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="submissions-${date}.${json ? 'json' : 'csv'}"`,
      'Cache-Control': 'no-store',
    },
  })
})

// Distinct forms that have submissions — the filter dropdown's options.
forms.get('/forms/submitted-forms', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ forms: listSubmittedForms(proj.id) })
})

forms.patch('/forms/submissions/:id', (c) => {
  markSeen(c.req.param('id'))
  return c.json({ ok: true })
})

forms.delete('/forms/submissions/:id', (c) => {
  deleteSubmission(c.req.param('id'))
  return c.json({ ok: true })
})

// ── SMTP config (password never returned) ──

forms.get('/forms/smtp', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json(getSmtpConfigForClient(proj.id))
})

forms.put('/forms/smtp', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as SmtpPatch
  setSmtpConfig(proj.id, body)
  return c.json(getSmtpConfigForClient(proj.id))
})

// Send a test email (defaults to the signed-in admin's address).
forms.post('/forms/smtp/test', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json().catch(() => ({}))) as { to?: string }
  const to = body.to?.trim() || currentUser(c)?.email
  if (!to) return c.json({ error: 'No recipient address.' }, 400)
  const res = await sendMail(proj.id, {
    to,
    subject: 'Superbird test email',
    text: 'This is a test email from your Superbird site. SMTP is working.',
  })
  return res.ok ? c.json({ ok: true, to }) : c.json({ error: res.error ?? 'Send failed.' }, 502)
})

export default forms
