import type { Context } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'

// Tiny in-memory fixed-window rate limiter. Enough to blunt brute-force /
// credential-stuffing on a single-process self-hosted server (no external
// store). Keyed strings let callers scope by IP, account, etc.
interface Bucket {
  count: number
  resetAt: number
}
const buckets = new Map<string, Bucket>()

export interface RateResult {
  ok: boolean
  retryAfter: number // seconds until the window resets
}

export function hit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  b.count++
  if (b.count > max) return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) }
  return { ok: true, retryAfter: 0 }
}

// SUPERBIRD_TRUST_PROXY: how many trusted reverse proxies sit in front of the
// app. Unset/empty/0 (the default) → do NOT trust ANY forwarding header; the
// client IP is the socket peer. A positive integer N → the client is the Nth
// entry from the right of X-Forwarded-For (each trusted proxy appends the address
// it received from, so the rightmost N entries are the proxy hops and any spoofed
// left-padding is ignored). Only ever set this if a proxy you control overwrites
// the header. See docs/security.md.
export const TRUSTED_PROXY_HOPS: number = (() => {
  const n = parseInt(process.env.SUPERBIRD_TRUST_PROXY ?? '', 10)
  return Number.isInteger(n) && n > 0 ? n : 0
})()

// Normalize an IP: trim, and unwrap IPv4-mapped IPv6 (`::ffff:1.2.3.4`) so it
// matches IPv4 allow-list entries. Returns null for empty/garbage.
function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null
  const s = ip.trim()
  if (!s) return null
  const m = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
  return m ? m[1]! : s
}

// The real socket peer, via the node-server adapter. Returns null when there is
// no underlying socket (e.g. app.fetch() in tests) rather than guessing.
function socketIp(c: Context): string | null {
  try {
    return normalizeIp(getConnInfo(c).remote.address)
  } catch {
    return null
  }
}

// Resolve the caller's IP under the trust policy above. `determined` is false
// only when we genuinely cannot identify the peer (no socket and no trustworthy
// header) — callers that gate on identity (the admin allow-list) MUST fail closed
// on `determined === false`. For rate-limit keying, an undetermined caller simply
// shares the `'unknown'` bucket (conservative), never a per-request-forgeable key.
export function resolveClientIp(c: Context): { ip: string; determined: boolean } {
  // Trust OFF (default): socket peer only; forwarding headers are ignored, so a
  // client-supplied X-Forwarded-For can neither pick its bucket nor forge the IP.
  if (TRUSTED_PROXY_HOPS === 0) {
    const ip = socketIp(c)
    return ip ? { ip, determined: true } : { ip: 'unknown', determined: false }
  }
  // Trust ON: take the Nth-from-right XFF entry.
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const chain = xff.split(',').map((s) => normalizeIp(s)).filter((s): s is string => s !== null)
    if (chain.length >= TRUSTED_PROXY_HOPS) {
      return { ip: chain[chain.length - TRUSTED_PROXY_HOPS]!, determined: true }
    }
  }
  // XFF absent/too short: X-Real-IP is set by the nearest hop, which is trusted
  // when trust is on. Then the socket (the nearest proxy itself) as a last resort.
  const real = normalizeIp(c.req.header('x-real-ip'))
  if (real) return { ip: real, determined: true }
  const sock = socketIp(c)
  return sock ? { ip: sock, determined: true } : { ip: 'unknown', determined: false }
}

export function clientIp(c: Context): string {
  return resolveClientIp(c).ip
}

// Evict stale buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}, 60_000).unref?.()
