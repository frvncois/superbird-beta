import { Hono } from 'hono'
import { getInstalledProject } from '../lib/project'
import { resolveForm, createSubmission, type EmailStatus } from '../lib/submissions'
import { hit, clientIp } from '../lib/rateLimit'
import { isSmtpConfigured, sendSubmissionEmail } from '../lib/mailer'
import { postWebhook } from '../lib/webhook'

const publicForms = new Hono()

const HONEYPOT = '_sb_hp'
const MAX_FIELDS = 100
const MAX_VALUE_LEN = 10_000
const DEFAULT_SUCCESS = 'Thanks! Your submission was received.'

// Public form submission — NOT auth-guarded (visitors post here). Spam-guarded
// by a rate limit + honeypot; the form must exist in the document, and what
// happens to the submission (save/email/webhook) is decided server-side from
// the stored form config, never from the request.
publicForms.post('/public/forms', async (c) => {
  const ip = clientIp(c)
  const limit = hit(`form:${ip}`, 20, 60_000)
  if (!limit.ok) return c.json({ error: 'Too many submissions. Please try again shortly.' }, 429, { 'Retry-After': String(limit.retryAfter) })

  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not available.' }, 409)

  let body: { formId?: string; pageUrl?: string; fields?: Record<string, unknown> }
  try {
    body = (await c.req.json()) as typeof body
  } catch {
    return c.json({ error: 'Invalid request.' }, 400)
  }

  const formId = typeof body.formId === 'string' ? body.formId : ''
  const rawFields = body.fields && typeof body.fields === 'object' ? body.fields : {}

  // Honeypot: a real user never fills the hidden field. Pretend success.
  if (rawFields[HONEYPOT]) return c.json({ ok: true, message: DEFAULT_SUCCESS })

  const form = resolveForm(proj.id, formId)
  if (!form) return c.json({ error: 'Unknown form.' }, 404)

  // Sanitise: string values only, honeypot dropped, count + length capped.
  const data: Record<string, string> = {}
  let n = 0
  for (const [k, v] of Object.entries(rawFields)) {
    if (k === HONEYPOT) continue
    if (n++ >= MAX_FIELDS) break
    if (typeof v === 'string') data[k] = v.slice(0, MAX_VALUE_LEN)
    else if (typeof v === 'number' || typeof v === 'boolean') data[k] = String(v)
  }

  const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : undefined

  // Delivery — email + webhook, decided entirely from the server-side config.
  let emailStatus: EmailStatus = 'skipped'
  let emailedTo: string | undefined
  // One or several comma-separated recipients.
  const recipients = (form.config.notificationEmail ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
  if (recipients.length && isSmtpConfigured(proj.id)) {
    const to = recipients.join(', ')
    const res = await sendSubmissionEmail(proj.id, to, form.name, data, pageUrl)
    emailStatus = res.ok ? 'sent' : 'failed'
    if (res.ok) emailedTo = to
  }
  if (form.config.webhookUrl) {
    // Best-effort — a failing webhook must not fail the visitor's submission.
    void postWebhook(form.config.webhookUrl, { form: form.name, formId, data, pageUrl, submittedAt: new Date().toISOString() })
  }

  if (form.config.saveToDb !== false) {
    createSubmission(proj.id, { formId, formName: form.name, data, pageUrl, ip, emailStatus, emailedTo })
  }

  return c.json({ ok: true, message: form.config.successMessage || DEFAULT_SUCCESS })
})

export default publicForms
