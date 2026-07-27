import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

// SSRF guard for author/admin-configured outbound requests (form webhooks, SMTP
// host). Blocks non-http(s) schemes and any hostname that resolves to a
// loopback/link-local/private/CGNAT/reserved address, and refuses redirects so a
// public URL can't bounce to an internal one.
//
// RESIDUAL RISK (documented in docs/security.md): validation resolves DNS, then
// the request re-resolves — an attacker-controlled name with a ~0 TTL could
// answer public during the check and private at connect (DNS rebinding). Fully
// closing it needs pinning the socket to the validated IP, which Node's global
// fetch doesn't expose without bundling undici; not done here.

const ALLOWED_SCHEMES = new Set(['http:', 'https:'])
const TIMEOUT_MS = 8_000

export class SafeFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const o = Number(p)
    if (!Number.isInteger(o) || o < 0 || o > 255) return null
    n = ((n << 8) | o) >>> 0
  }
  return n >>> 0
}

function inCidr(n: number, baseStr: string, bits: number): boolean {
  const base = ipv4ToInt(baseStr)!
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return ((n & mask) >>> 0) === ((base & mask) >>> 0)
}

function isBlockedIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return true // unparseable → block
  return (
    inCidr(n, '0.0.0.0', 8) || // "this host"
    inCidr(n, '10.0.0.0', 8) || // private
    inCidr(n, '100.64.0.0', 10) || // CGNAT
    inCidr(n, '127.0.0.0', 8) || // loopback
    inCidr(n, '169.254.0.0', 16) || // link-local (incl. cloud metadata)
    inCidr(n, '172.16.0.0', 12) || // private
    inCidr(n, '192.168.0.0', 16) || // private
    inCidr(n, '192.0.0.0', 24) || // IETF
    inCidr(n, '192.0.2.0', 24) || // TEST-NET-1
    inCidr(n, '198.18.0.0', 15) || // benchmarking
    inCidr(n, '198.51.100.0', 24) || // TEST-NET-2
    inCidr(n, '203.0.113.0', 24) || // TEST-NET-3
    inCidr(n, '224.0.0.0', 4) || // multicast
    inCidr(n, '240.0.0.0', 4) || // reserved
    n === 0xffffffff // broadcast
  )
}

function isBlockedIPv6(raw: string): boolean {
  const addr = raw.toLowerCase().split('%')[0]! // drop any zone id
  if (addr === '::1' || addr === '::') return true // loopback / unspecified
  // Embedded IPv4 (::ffff:1.2.3.4 or ::1.2.3.4) → classify the v4.
  const v4 = addr.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (v4) return isBlockedIPv4(v4[1]!)
  const head = addr.split(':').find(Boolean) ?? '' // first non-empty hextet
  const hextet = parseInt(head, 16)
  if (Number.isNaN(hextet)) return true // can't classify → block
  if ((hextet & 0xfe00) === 0xfc00) return true // fc00::/7 unique-local
  if ((hextet & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  return false // global unicast → allow
}

function isBlockedAddress(ip: string): boolean {
  const fam = isIP(ip)
  if (fam === 4) return isBlockedIPv4(ip)
  if (fam === 6) return isBlockedIPv6(ip)
  return true // not a recognizable IP → block
}

// Reject a hostname (or IP literal) that is, or resolves to, a non-public
// address. Rejects if ANY resolved address is blocked (defeats split-horizon /
// multi-A tricks). Exported for the SMTP host check.
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, '') // strip IPv6 URL brackets
  if (!host) throw new SafeFetchError('Empty host')
  if (isIP(host)) {
    if (isBlockedAddress(host)) throw new SafeFetchError(`Blocked address: ${host}`)
    return
  }
  let results: { address: string }[]
  try {
    results = await lookup(host, { all: true })
  } catch {
    throw new SafeFetchError(`Cannot resolve ${host}`)
  }
  if (results.length === 0) throw new SafeFetchError(`Cannot resolve ${host}`)
  for (const { address } of results) {
    if (isBlockedAddress(address)) throw new SafeFetchError(`${host} resolves to blocked address ${address}`)
  }
}

// Validated fetch: http(s) only, host must resolve to a public address, redirects
// are NOT followed (redirect:'manual' → Node returns an opaque redirect, so a
// 3xx to an internal target is never contacted), 8s timeout. Throws
// SafeFetchError on a policy violation.
export async function safeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input)
  if (!ALLOWED_SCHEMES.has(url.protocol)) throw new SafeFetchError(`Blocked scheme: ${url.protocol}`)
  await assertPublicHost(url.hostname)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, redirect: 'manual', signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}
