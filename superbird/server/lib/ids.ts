import { randomBytes } from 'node:crypto'

// Prefixed opaque id, e.g. randomId('user') → 'user_a1b2c3d4e5f6'.
export function randomId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString('hex')}`
}

// Bare hex token (e.g. for on-disk filenames).
export function randomHex(bytes = 8): string {
  return randomBytes(bytes).toString('hex')
}
