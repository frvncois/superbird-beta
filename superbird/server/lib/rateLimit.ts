import type { Context } from 'hono'

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

// Best-effort client IP. Behind a trusted reverse proxy this is the real client
// (X-Forwarded-For); on direct exposure a spoofed/absent header just shares one
// bucket — the per-account limit still bounds targeted password guessing.
export function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return c.req.header('x-real-ip') ?? 'unknown'
}

// Evict stale buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}, 60_000).unref?.()
