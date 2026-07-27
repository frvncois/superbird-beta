# Security

Posture and hardening for a self-hosted, internet-facing Superbird instance.

## What's protected (in code)

- **Passwords**: scrypt with a 16-byte per-password salt, constant-time compare
  (`server/lib/password.ts`). Policy: 8-256 chars, enforced on install **and**
  user creation.
- **Brute force**: `/api/login` is rate-limited per-IP (30 / 5 min) and
  per-account (10 / 15 min) -> `429` (`server/lib/rateLimit.ts`). Login does equal
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
  `application/octet-stream; attachment` -- a malicious SVG/HTML upload can't run
  script on the admin origin.
- **Form submissions**: `POST /api/public/forms` is the only public write endpoint.
  It's rate-limited (20/min/IP) + honeypot-guarded, validates the form exists in
  the document, and caps field count/size. What happens to a submission (save to
  DB / email / webhook) is decided **server-side** from the stored form config --
  the browser payload can't force it. Stored submissions are **admin-only**
  (`/api/forms/*` is `requireAuth`); they're never served publicly or in the SSR
  site. Export (`/api/forms/submissions/export`) is auth-guarded + rate-limited.
- **SMTP credentials** live in a dedicated server table (`smtp_config`), never in
  the exportable document/backup and never returned to the client (the API exposes
  only `hasPassword`; the password is write-only). Backups include submissions but
  **not** SMTP config.
- **Private media**: a media item flagged `private` (or living in a `private`
  folder -- the flag cascades down the folder tree) is served by `/media/:id`
  only to an authenticated admin; anonymous callers get `404` (existence hidden,
  not `403`) and the response is `Cache-Control: private, no-store`. Set/cleared
  in the media library (item toggle or folder context menu).
- **SSRF (outbound requests)**: the two places the server fetches an
  admin-configured destination — form **webhooks** (`POST` per submission,
  `lib/webhook.ts`) and the **SMTP host** ("send test email" + notification
  emails, `lib/mailer.ts`) — go through a shared guard (`lib/safeFetch.ts`).
  It allows only `http:`/`https:`, resolves the hostname (`dns.lookup`, all
  addresses) and **rejects if any resolves to** loopback (`127/8`, `::1`),
  link-local (`169.254/16` incl. cloud metadata, `fe80::/10`), private
  (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), CGNAT (`100.64/10`),
  IPv4-mapped forms, or reserved/test ranges — and **refuses redirects**
  (`redirect:'manual'`, so a public URL can't 3xx-bounce to an internal one),
  keeping an 8s timeout. **Not covered:** this is validate-then-connect, so a
  name that answers public during validation and private at connect (**DNS
  rebinding**, ~0 TTL) is a residual TOCTOU — the request re-resolves and Node's
  global `fetch`/`nodemailer` don't expose socket-pinning to the validated IP
  without bundling `undici`. Delivery is blind (the webhook response is
  discarded), so this bounds recon/side-effects, not exfiltration. Bind internal
  services to non-routable interfaces + egress-firewall the box as the real
  boundary.
- **HTTP headers**: `secureHeaders()` globally -- `X-Frame-Options: SAMEORIGIN`
  (clickjacking), `nosniff`, `Referrer-Policy`, HSTS.
- **DoS**: 30 MB request-body limit; SSR render walkers cap depth at 64
  (no stack overflow); `collection-list` limit clamped to <=100; `sharp` decode
  capped at 100 MP (image-bomb guard); uploads validated (fonts by magic bytes).
- **Errors**: a global handler returns a generic 500 -- no stack traces leak.
- **MCP bridge**: fail-closed (off unless `SUPERBIRD_MCP_TOKEN` set); external
  endpoints require the token (constant-time compare + rate limit); editor
  endpoints require an admin session. See `docs/mcp.md`.

## Deployment checklist (operational -- do these)

1. **Run behind HTTPS** and set `NODE_ENV=production` (enables the `Secure`
   cookie; HSTS then makes sense).
2. **Reverse proxy + `SUPERBIRD_TRUST_PROXY`**: forwarding headers
   (`X-Forwarded-For`/`X-Real-IP`) are **ignored by default** — the rate limiter
   and the admin IP allow-list key on the real socket peer, so a client can't
   spoof its IP. If (and only if) you run behind a reverse proxy you control, set
   `SUPERBIRD_TRUST_PROXY` to the number of trusted proxy hops in front of the app
   (e.g. `1` for a single nginx/Caddy; `2` for CDN→nginx). Superbird then takes the
   client IP as the Nth entry from the right of `X-Forwarded-For`, so a spoofed
   header can't win. **Do not set it when directly exposed** — that would let
   clients forge their IP. Note: with `SUPERBIRD_ADMIN_ALLOW_IPS` set but
   `SUPERBIRD_TRUST_PROXY` unset while actually behind a proxy, the allow-list
   matches the *proxy's* IP for every request (Superbird logs a startup warning
   for this combo); when it can't identify the caller at all it fails closed.
3. **First-run install is a race**: `/api/install` is public until the project
   exists (whoever installs first becomes admin). **Complete setup immediately**
   after first boot, or install locally and deploy the resulting `data/` -- do not
   leave a fresh, un-installed instance internet-reachable.
4. **Tokens**: set a strong random `SUPERBIRD_MCP_TOKEN` only if you use the MCP
   bridge; otherwise leave it unset (bridge stays disabled).
5. **Back up `data/`** (SQLite DB + uploaded media/fonts).

## Backup / export

Settings -> Backup: server-side document snapshots (manual + daily auto + restore
+ delete) and a portable `.sbbackup` export/import (document + media + fonts) for
moving a site between installs. Every endpoint is session-guarded and scoped to
the single installed project -- export is streamed to the authenticated admin
only, never written to a public path, so no one can pull or overwrite another
instance's backup. Import replaces the project and sanitizes bundled file paths
with `basename` against traversal. It is **failure-safe**: before deleting
anything it writes a **full** recoverable safety backup (`pre-import-backup.sbbackup`
in `data/` — document + media + submissions + fonts, not just the document
snapshot), stages every incoming media file to a temp dir, swaps the DB rows in a
single transaction (all-or-nothing), and only then removes the old files and moves
the staged ones in — so a malformed/oversized bundle or a mid-write error leaves
the project untouched (or recoverable from the on-disk safety backup). Each bundled
media file is capped (50 MB) independently of the 256 MB whole-bundle limit.

## Known trade-offs / future work

- **Custom-code fields** (`siteSettings.customCode.*`) are rendered raw by design
  (`src/lib/render/index.ts`) — head/body code injected verbatim, `customCss`
  emitted in a `<style>` with `<` escaped. They go **only** into the published
  public page (the SSR path passes them; the editor Preview and both preview
  overlays do not). Caveat: in the **default single-process deployment** the
  public site shares an origin with `/api` and `/admin`, so admin-authored custom
  JS runs same-origin — fine under the single-admin model, but a lateral
  persistence vector once there's a second admin (an admin who edits custom code
  can act as any other admin who later browses the public site while signed in).
  Serving the public site from a separate origin removes this.
- **Uploads**: fonts are magic-byte validated at upload **and** on backup import;
  media is **not** — its type is client-supplied, so the defense is the serving
  layer (`nosniff` + CSP sandbox + forced `attachment` for HTML/XML/SVG), not the
  upload path. Media is served from the **same origin** as the admin; a separate
  cookieless media origin would be strictly safer.
- **"Log out everywhere" ships** (`POST /api/logout-all`, `auth.ts`), but there is
  **no password-change/reset flow** at all (`users.ts` is create + delete only) —
  a forgotten admin password means editing the DB. A self-service password change
  (invalidating other sessions via `endAllSessions`) is worth adding to the roadmap.
- Single-admin model: every user is a full admin (roles were intentionally
  dropped) -- there's no privilege separation between users.
