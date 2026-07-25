import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto'

// RFC 6238 (TOTP) / RFC 4226 (HOTP) — SHA-1, 6 digits, 30-second step. No
// third-party dependency: base32 + HMAC over node:crypto. Recovery codes are
// high-entropy random strings stored as SHA-256 hashes (fast hashing is fine —
// unlike passwords they aren't guessable/low-entropy).

const STEP_SECONDS = 30
const DIGITS = 6
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Random base32 secret (no padding) — 20 bytes = 160 bits, the RFC-recommended size. */
export function generateSecret(): string {
  const bytes = randomBytes(20)
  let bits = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  return out
}

/** Decode a base32 string (case-insensitive, padding/space tolerant) to bytes. */
function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  let bits = ''
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch)
    if (idx === -1) continue // skip stray chars
    bits += idx.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

/** HOTP code for a specific counter. */
function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  // 8-byte big-endian counter (safe for counters within 2^53).
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff)
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0')
}

/** The current TOTP code (used only for tests / debugging). */
export function totp(secret: string, atMs: number = Date.now()): string {
  return hotp(secret, Math.floor(atMs / 1000 / STEP_SECONDS))
}

/** Verify a user-entered code against the secret, allowing ±`window` steps for clock skew. */
export function verifyTotp(secret: string, code: string, atMs: number = Date.now(), window = 1): boolean {
  const trimmed = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(trimmed)) return false
  const counter = Math.floor(atMs / 1000 / STEP_SECONDS)
  for (let w = -window; w <= window; w++) {
    const c = counter + w
    if (c < 0) continue // only meaningful near the Unix epoch; never in practice
    const expected = hotp(secret, c)
    // Constant-time compare (both fixed 6-char length).
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(trimmed))) return true
  }
  return false
}

/** `otpauth://` provisioning URI for manual entry / authenticator apps. */
export function otpauthUri(secret: string, account: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) })
  return `otpauth://totp/${label}?${params.toString()}`
}

// ── Recovery codes ──

const RECOVERY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** N single-use recovery codes (formatted `xxxxx-xxxxx`). Shown once at enrollment. */
export function generateRecoveryCodes(n = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < n; i++) {
    let raw = ''
    const bytes = randomBytes(10)
    for (const b of bytes) raw += RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`)
  }
  return codes
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code.trim().toLowerCase()).digest('hex')
}

/** Returns the remaining (still-valid) hashes if `code` matched one, else null. Single-use: the match is removed. */
export function consumeRecoveryCode(hashes: string[], code: string): string[] | null {
  const target = hashRecoveryCode(code)
  const idx = hashes.findIndex((h) => h.length === target.length && timingSafeEqual(Buffer.from(h), Buffer.from(target)))
  if (idx === -1) return null
  return hashes.filter((_, i) => i !== idx)
}
