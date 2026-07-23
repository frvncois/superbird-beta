import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Password hashing with Node's built-in scrypt — no native/3rd-party deps.
// Stored form: scrypt$<saltHex>$<hashHex>

const KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEYLEN)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, salt, KEYLEN)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// One password policy, shared by install + user creation so they can't drift.
// Returns an error message, or null if acceptable. Max length bounds scrypt CPU.
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 256) return 'Password is too long (max 256).'
  return null
}

// A fixed hash to verify against when an account doesn't exist, so login does
// equal scrypt work either way (no timing oracle for user enumeration).
export const DUMMY_HASH = hashPassword('superbird-timing-equalizer')
