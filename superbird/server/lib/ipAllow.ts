import type { Context } from 'hono'
import { clientIp } from './rateLimit'

// Optional network lockdown for the ADMIN surface only. Set the env var
//   SUPERBIRD_ADMIN_ALLOW_IPS="127.0.0.1,10.0.0.0/8,203.0.113.4"
// to a comma-separated list of exact IPs and/or IPv4 CIDRs. Unset/empty = no
// restriction (default). Enforced in requireAuth + login/install, so public
// visitor traffic (storefront, form posts, Stripe webhook, SSR) is never
// affected. Env-based on purpose: a wrong entry is fixed by editing env and
// restarting — it can never be a permanent, self-inflicted UI lockout.
//
// Behind a reverse proxy this relies on X-Forwarded-For (see clientIp); on
// direct exposure the header is absent and the check falls back to 'unknown',
// so pair this with a proxy that sets XFF, or bind to localhost. The real
// network boundary is the proxy/firewall — this is a second, in-app layer.

const raw = (process.env.SUPERBIRD_ADMIN_ALLOW_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const adminIpLockEnabled = raw.length > 0

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const part of parts) {
    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null
    n = (n << 8) | octet
  }
  return n >>> 0
}

interface Cidr {
  base: number
  mask: number
}

const exact = new Set<string>()
const cidrs: Cidr[] = []
for (const entry of raw) {
  if (entry.includes('/')) {
    const [ip, bitsStr] = entry.split('/')
    const base = ipv4ToInt(ip ?? '')
    const bits = Number(bitsStr)
    if (base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) continue
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
    cidrs.push({ base: (base & mask) >>> 0, mask })
  } else {
    exact.add(entry)
  }
}

function ipMatches(ip: string): boolean {
  if (exact.has(ip)) return true
  const n = ipv4ToInt(ip)
  if (n === null) return false // non-IPv4 that wasn't an exact match
  for (const { base, mask } of cidrs) {
    if (((n & mask) >>> 0) === base) return true
  }
  return false
}

/** True if this request's client IP may reach the admin surface. */
export function adminIpAllowed(c: Context): boolean {
  if (!adminIpLockEnabled) return true
  return ipMatches(clientIp(c))
}
