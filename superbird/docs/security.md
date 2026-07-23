# Security

Posture and hardening for a self-hosted, internet-facing Superbird instance.

## What's protected (in code)

- **Passwords**: scrypt with a 16-byte per-password salt, constant-time compare
  (`server/lib/password.ts`). Policy: 8â256 chars, enforced on install **and**
  user creation.
- **Brute force**: `/api/login` is rate-limited per-IP (30 / 5 min) and
  per-account (10 / 15 min) â `429` (`server/lib/rateLimit.ts`). Login does equal
  scrypt work whether or not the account exists (no timing enumeration).
- **Sessions**: 256-bit opaque tokens, `httpOnly` + `SameSite=Lax` cookie,
  `Secure` in production, server-side expiry + logout invalidation, new token per
  login (no fixation). SameSite=Lax is the CSRF mitigation (no separate token).
- **SQL**: all queries go through Drizzle bound parameters; the only raw SQL is
  static DDL in `ensureSchema`. No user value is interpolated into SQL.
- **XSS (published site)**: author URLs (links/embeds/video) are scheme
  allow-listed (`http/https/mailto/tel` + relative; blocks `javascript:`/`data:`);
  custom attributes reject `on*` handlers and URL/script-bearing names; all
  content/attrs are HTML-escaped; markdown is escaped + link-scheme-restricted.
- **Uploaded-file XSS**: `/media/:id` is served with `X-Content-Type-Options:
  nosniff` + `Content-Security-Policy: sandbox`, and HTML/XML types are forced to
  `application/octet-stream; attachment` â a malicious SVG/HTML upload can't run
  script on the admin origin.
- **HTTP headers**: `secureHeaders()` globally â `X-Frame-Options: SAMEORIGIN`
  (clickjacking), `nosniff`, `Referrer-Policy`, HSTS.
- **DoS**: 30 MB request-body limit; SSR render walkers cap depth at 64
  (no stack overflow); `collection-list` limit clamped to â¤100; `sharp` decode
  capped at 100 MP (image-bomb guard); uploads validated (fonts by magic bytes).
- **Errors**: a global handler returns a generic 500 â no stack traces leak.
- **MCP bridge**: fail-closed (off unless `SUPERBIRD_MCP_TOKEN` set); external
  endpoints require the token (constant-time compare + rate limit); editor
  endpoints require an admin session. See `docs/mcp.md`.

## Deployment checklist (operational â do these)

1. **Run behind HTTPS** and set `NODE_ENV=production` (enables the `Secure`
   cookie; HSTS then makes sense).
2. **Reverse proxy**: put a trusted proxy in front so `X-Forwarded-For` is real
   (the rate limiter keys on it). Don't let clients spoof it.
3. **First-run install is a race**: `/api/install` is public until the project
   exists (whoever installs first becomes admin). **Complete setup immediately**
   after first boot, or install locally and deploy the resulting `data/` â do not
   leave a fresh, un-installed instance internet-reachable.
4. **Tokens**: set a strong random `SUPERBIRD_MCP_TOKEN` only if you use the MCP
   bridge; otherwise leave it unset (bridge stays disabled).
5. **Back up `data/`** (SQLite DB + uploaded media/fonts).

## Backup / export

Settings → Backup: server-side document snapshots (manual + daily auto + restore
+ delete) and a portable `.sbbackup` export/import (document + media + fonts) for
moving a site between installs. Every endpoint is session-guarded and scoped to
the single installed project — export is streamed to the authenticated admin
only, never written to a public path, so no one can pull or overwrite another
instance's backup. Import replaces the project (a safety backup is taken first)
and sanitizes bundled file paths with `basename` against traversal.

## Known trade-offs / future work

- **Custom-code fields** (`siteSettings.customCode.*`) are captured but not yet
  rendered anywhere. When wired up they are raw HTML/JS/CSS by design â inject
  them **only** into the published public page, never the admin SPA, and escape
  `</` in `customCss`.
- Media is served from the **same origin** as the admin; the `nosniff` + sandbox
  headers neutralize active content, but serving media from a separate
  cookieless origin would be strictly safer.
- No per-user session cap / "log out everywhere"; add on a password-change flow.
- Single-admin model: every user is a full admin (roles were intentionally
  dropped) â there's no privilege separation between users.
