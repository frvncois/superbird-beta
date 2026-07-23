import { randomBytes } from 'node:crypto'

// Prefixed opaque id (96-bit random). Used for public, unguessable resource ids
// (e.g. /media/:id served without auth), so keep the entropy high.
export function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`
}

// Bare hex token (e.g. for on-disk filenames).
export function randomHex(bytes = 8): string {
  return randomBytes(bytes).toString('hex')
}
