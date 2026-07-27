import type { Context } from 'hono'
import { resolveClientIp, TRUSTED_PROXY_HOPS } from './rateLimit'

// Optional network lockdown for the ADMIN surface only. Set the env var
//   SUPERBIRD_ADMIN_ALLOW_IPS="127.0.0.1,10.0.0.0/8,203.0.113.4"
// to a comma-separated list of exact IPs and/or IPv4 CIDRs. Unset/empty = no
// restriction (default). Enforced in requireAuth + login/install, so public
// visitor traffic (public form posts, SSR site) is never
// affected. Env-based on purpose: a wrong entry is fixed by editing env and
// restarting — it can never be a permanent, self-inflicted UI lockout.
//
// IP resolution follows SUPERBIRD_TRUST_PROXY (see resolveClientIp): with trust
// OFF (default) the check matches the direct socket peer; with trust ON it matches
// the client behind the configured number of proxy hops. The real network
// boundary is the proxy/firewall — this is a second, in-app layer.

const raw = (process.env.SUPERBIRD_ADMIN_ALLOW_IPS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const adminIpLockEnabled = raw.length > 0

// The allow-list can only be as trustworthy as the IP it checks. If it's enabled
// but no proxy is trusted, it matches the direct socket peer — correct on direct
// exposure, but WRONG (matches the proxy for every request) if you're actually
// behind a reverse proxy. Warn the operator once at startup.
if (adminIpLockEnabled && TRUSTED_PROXY_HOPS === 0) {
  console.warn(
    '[superbird] SUPERBIRD_ADMIN_ALLOW_IPS is set but SUPERBIRD_TRUST_PROXY is not — ' +
      'the allow-list will match the direct socket peer. If Superbird runs behind a reverse ' +
      'proxy, set SUPERBIRD_TRUST_PROXY=<trusted-hop-count> or the allow-list will see the ' +
      'proxy IP for every request (and thus allow or deny everyone alike).',
  )
}

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
  const { ip, determined } = resolveClientIp(c)
  // An allow-list that can't identify the caller must not silently pass.
  if (!determined) return false
  return ipMatches(ip)
}
