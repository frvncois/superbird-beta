import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Password hashing with Node's built-in scrypt — no native/3rd-party deps.
// ASYNC on purpose: scryptSync blocks the event loop for the whole hash (~320ms
// at these parameters), so an unauthenticated caller hammering /login (which runs
// a real scrypt even for unknown accounts, to keep timing equal) could stall the
// single process — including the public SSR site. The async form runs on the
// libuv threadpool, so it degrades under load instead of hard-blocking. (The
// threadpool caps concurrency at UV_THREADPOOL_SIZE, default 4; the per-IP login
// limit — now keyed on the real socket peer, see rateLimit.ts — is the other half.)
//
// Stored form: scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>. Parameters live in the
// string so they can be raised later without invalidating existing hashes; a
// legacy 3-field `scrypt$salt$hash` is read with Node's old defaults.

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

const KEYLEN = 64
// OWASP floor for scrypt (2^17 / r=8 / p=1). scrypt needs 128*N*r bytes
// (=128 MiB here), which exceeds Node's default 32 MiB maxmem and would throw
// ERR_CRYPTO_INVALID_SCRYPT_PARAMS — so pass an explicit ceiling with headroom.
const PARAMS = { N: 131072, r: 8, p: 1 }
const MAXMEM = 160 * 1024 * 1024

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, KEYLEN, { ...PARAMS, maxmem: MAXMEM })
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts[0] !== 'scrypt') return false

  let N: number, r: number, p: number, saltHex: string | undefined, hashHex: string | undefined
  if (parts.length === 6) {
    ;[, , , , saltHex, hashHex] = parts
    N = Number(parts[1])
    r = Number(parts[2])
    p = Number(parts[3])
  } else if (parts.length === 3) {
    // Legacy scrypt$salt$hash → Node's historical scrypt defaults.
    N = 16384
    r = 8
    p = 1
    saltHex = parts[1]
    hashHex = parts[2]
  } else {
    return false
  }
  if (!saltHex || !hashHex || !Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, salt, expected.length || KEYLEN, { N, r, p, maxmem: MAXMEM })
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
// equal scrypt work either way (no timing oracle for user enumeration). Computed
// ONCE at startup (a promise) with the current parameters — awaited per request,
// never re-hashed.
export const DUMMY_HASH_PROMISE: Promise<string> = hashPassword('superbird-timing-equalizer')
