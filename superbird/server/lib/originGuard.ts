import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { SESSION_COOKIE } from './session'
import { getInstalledProject, getDeploymentOrigin } from './project'

// Trusted-origin (CSRF) guard for the authenticated admin API. It only acts on
// state-changing requests that carry an admin session cookie — so public
// callers (public form posts, the token-auth MCP bridge, login/install before a
// session exists) are never affected.
//
// For a guarded request the browser Origin (or Referer) must be in the
// allowlist: the server's own origin, localhost in dev, and the configured
// deployment URL (Settings › General). A missing Origin AND Referer passes —
// only browsers send them, and a cross-site attacker cannot strip Origin, so
// the real CSRF vector is still blocked. The configured URL is additive: the
// admin's own origin always stays allowed, so a misconfiguration can't lock the
// user out of their own editor.

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function requestOrigin(c: Context): string | null {
  const origin = c.req.header('origin')
  if (origin) return origin
  const referer = c.req.header('referer')
  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      /* malformed referer → treat as absent */
    }
  }
  return null
}

function isLocalhostDev(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') return false
  try {
    const host = new URL(origin).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  } catch {
    return false
  }
}

export async function originGuard(c: Context, next: Next): Promise<Response | void> {
  if (!UNSAFE.has(c.req.method)) return next()
  // Not an admin action (no session cookie) → out of scope for this guard.
  if (!getCookie(c, SESSION_COOKIE)) return next()

  const origin = requestOrigin(c)
  if (!origin) return next() // non-browser client (no Origin/Referer)

  const allowed = new Set<string>()
  try {
    allowed.add(new URL(c.req.url).origin) // the server's own front door
  } catch {
    /* c.req.url should always parse; ignore if not */
  }
  const project = getInstalledProject()
  const deployment = project ? getDeploymentOrigin(project.id) : null
  if (deployment) allowed.add(deployment)

  if (allowed.has(origin) || isLocalhostDev(origin)) return next()
  return c.json({ error: 'Origin not allowed.' }, 403)
}
