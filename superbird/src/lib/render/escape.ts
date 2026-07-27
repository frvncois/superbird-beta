// HTML/attribute escaping for the render pipeline. One home so html.ts and
// index.ts can't drift (they previously had two attr escapers, one missing `>`).

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

// A syntactically valid HTML attribute name.
const ATTR_NAME = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/

// Custom-attribute keys are an escape hatch for extra attributes the builder has
// no dedicated field for. Allow-list rather than deny-list: only `data-*`,
// `aria-*`, and a small set of inert global attributes pass — everything else
// (event handlers, `style`, and URL/script-bearing attrs like `href`/`src`/
// `formaction`/`ping`/`poster`/bare `data`) is rejected by default. Dedicated
// fields already cover id/title/role/aria/classes/links/media, so this stays tight.
const SAFE_ATTR_ALLOWLIST = new Set(['role', 'title', 'lang', 'dir', 'tabindex', 'translate', 'hidden'])
export function isSafeAttrName(name: string): boolean {
  if (!ATTR_NAME.test(name)) return false
  const n = name.toLowerCase()
  if (n.startsWith('data-') || n.startsWith('aria-')) return true
  return SAFE_ATTR_ALLOWLIST.has(n)
}

// Allow only safe URL schemes for author-set links/embeds. Blocks javascript:,
// data:, vbscript:, etc.; relative/anchor URLs (no scheme) are allowed.
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])
export function safeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  const m = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)
  if (!m) return trimmed // relative / anchor / path — no scheme, safe
  return SAFE_SCHEMES.has(m[1]!.toLowerCase()) ? trimmed : undefined
}
