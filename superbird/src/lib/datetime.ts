// Centralized date/time helpers. Timestamps across the app are ISO strings
// (e.g. `new Date().toISOString()` from the server); these normalize + format
// them so relative/readable time reads the same everywhere.

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

/**
 * Long relative time: "just now", "42 seconds ago", "3 minutes ago",
 * "2 hours ago", "4 days ago", "2 months ago", "1 year ago".
 * Returns '' for a missing/invalid value.
 */
export function timeAgo(value: string | number | Date | null | undefined, now: number = Date.now()): string {
  const d = toDate(value)
  if (!d) return ''
  const secs = Math.floor((now - d.getTime()) / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs} seconds ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return plural(mins, 'minute')
  const hours = Math.floor(mins / 60)
  if (hours < 24) return plural(hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 30) return plural(days, 'day')
  const months = Math.floor(days / 30)
  if (months < 12) return plural(months, 'month')
  return plural(Math.floor(days / 365), 'year')
}

/**
 * Compact relative time for dense lists: "now", "5m", "3h", "2d", "4w".
 * Returns '' for a missing/invalid value.
 */
export function timeAgoShort(value: string | number | Date | null | undefined, now: number = Date.now()): string {
  const d = toDate(value)
  if (!d) return ''
  const s = Math.floor((now - d.getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return `${Math.floor(s / 604800)}w`
}

/** Readable absolute date: "Jan 5, 2026". `fallback` for a missing/invalid value. */
export function formatDate(value: string | number | Date | null | undefined, fallback = ''): string {
  const d = toDate(value)
  return d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : fallback
}

/** Readable date + time: "Jan 5, 2026, 3:42 PM". `fallback` for a missing/invalid value. */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = ''): string {
  const d = toDate(value)
  return d
    ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : fallback
}
