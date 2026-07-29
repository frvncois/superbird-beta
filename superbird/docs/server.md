# Backend tier (server / API / DB)

> **Status: shipped.** Auth/install, the whole-document project store
> (design + content: collections/entries live in the `project_state` JSON, not
> yet normalised into rows), media (files-on-disk + metadata), forms +
> submissions,
> the render pipeline, and the **public SSR site** (draft/publish, per-request
> render with an in-memory published-design + compiled-asset cache) are all
> built. See the routes table below and `render.md`.

The standalone backend that replaces WordPress's database + admin API. Same
repo as the Vue client; shares TypeScript types via `@shared`.

## Stack

- **Hono** (`server/`) — the HTTP/API layer; also hosts the public SSR runtime (`routes/site.ts`).
- **SQLite via better-sqlite3 + Drizzle ORM** — one file per project at `data/superbird.db` (git-ignored). "Move the folder, it runs."
- **Node `scrypt`** for password hashing (no native/3rd-party crypto dep).
- **Cookie sessions** — opaque token in a `sb_session` httpOnly cookie, rows in the `sessions` table.
- **Trusted-origin guard** (`lib/originGuard.ts`, mounted `app.use('/api/*', …)`) — CSRF hardening on the admin API. Acts only on state-changing methods that carry `sb_session`; the request `Origin`/`Referer` must be in the allowlist (server's own origin + dev localhost + the configured deployment URL from `siteSettings.deployment.url`). Missing Origin+Referer passes (non-browser: webhook, MCP token bridge). The admin's own origin always stays allowed, so the setting is additive and can't lock the user out.

## Layout

```
server/
  index.ts            Hono app + @hono/node-server bootstrap (port 3001)
  db/
    client.ts         better-sqlite3 + drizzle instance; ensureSchema()
    schema.ts         Drizzle tables: projects, users, sessions, media, mediaFolders, backups, submissions, comments, snapshots, smtpConfig, projectState
  lib/
    password.ts       scrypt hash/verify
    session.ts        session create/read/destroy + cookie helpers
  routes/
    auth.ts           /api/session, /api/install, /api/login, /api/logout
  tsconfig.json
shared/
  types.ts            canonical API contract (client @shared/*, server relative)
drizzle.config.ts     drizzle-kit config (for future migrations)
```

## API (current)

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /api/session` | — | Boot state: `{ installed, project, user }` in one call |
| `POST /api/install` | — | First-run: create project + admin user, open session (409 if already installed) |
| `POST /api/login` | — | Verify credentials → open session, or return a 2FA `{ challenge }` |
| `POST /api/login/2fa` | — | Complete a 2FA challenge with a TOTP/recovery code → open session |
| `POST /api/logout` · `/logout-all` | session | Destroy this session · revoke all of the user's sessions |
| `POST /api/2fa/{setup,enable,disable}` | session | TOTP enrollment: mint secret · confirm + return recovery codes · turn off |
| `GET /api/project` | ✓ | Load the project document (`{ design, content }`); `design:null` on a fresh project |
| `PUT /api/project` | ✓ | Upsert the project document |
| `POST /api/publish` | ✓ | Snapshot the working design as the live/published design |
| `GET /api/media` · `POST` · `PATCH/:id` · `DELETE/:id` | ✓ | Media metadata CRUD + upload (multipart) |
| `POST/PATCH/DELETE /api/media/folders[/:id]` | ✓ | Media folders |
| `GET /media/:id` | — | **Public** — stream a media file (private items → 404 unless authed) |
| `POST /api/public/forms` | — | **Public** — form submission (rate-limit + honeypot; save/email/webhook per server-side config) |
| `GET /api/forms/submissions` · `PATCH/:id` · `DELETE/:id` | ✓ | Submissions list (form/status/date/search filters), mark-seen, delete |
| `GET /api/comments` · `POST` · `PATCH/:id` · `DELETE/:id` | ✓ | Editor-only comment threads (canvas pins). `PATCH` = resolve/edit |
| `POST/DELETE /api/comments/:id/replies[/:replyId]` | ✓ | Add / remove a reply on a thread |
| `GET /api/snapshots` · `POST` · `GET/:id` · `PATCH/:id` · `DELETE/:id` | ✓ | Version history (own table, hash-deduped). `GET/:id` = full document; `PATCH` = pin/label |
| `POST /api/snapshots/:id/restore` | ✓ | Safety-snapshot current, then overwrite the working document |
| `GET /api/forms/submitted-forms` | ✓ | Distinct forms with submissions (filter options) |
| `GET /api/forms/submissions/export` | ✓ | Scoped CSV/JSON export (rate-limited attachment) |
| `GET/PUT /api/forms/smtp` · `POST /api/forms/smtp/test` | ✓ | SMTP config (password write-only) + test email |
| `GET /api/health` | — | Liveness |
| `GET /*` (non-`/api`, non-`/media`) | — | **Public SSR site** — resolves the URL and returns rendered HTML |

## Media

Metadata rows in `media` / `media_folders`; the **bytes live on disk** in
`data/media/` (never in SQLite, per the doc). Upload writes the file and a row;
delete removes both. Files serve at `/media/:id` (public, long-cache) — that's
what `mediaUrl(id)` resolves to in both the editor and SSR, so **published-site
images now render**. Client: `src/stores/media.ts` is API-backed (`load()` on
sign-in; `addMediaItem` computes image dims client-side then multipart-POSTs).
Media is not publish-gated — files always serve.

**Image compression** (`server/lib/media.ts`, via `sharp`): on upload, raster
images are converted to **WebP**, resized to fit within max dimensions
(aspect preserved, never enlarged), at a set quality — **SVG and GIF pass
through untouched**. Settings live in `siteSettings.imageCompression`
(`enabled` default true, `maxWidth`/`maxHeight` 2000, `quality` 90), edited in
**Settings → Media**, persisted in the project document; the upload route reads
them via `getCompressionSettings(projectId)`. Compression failures fall back to
the original bytes.

## Project persistence

The whole editable project is **one JSON document** per project (`project_state`
table, one row). It holds `design` (pages, styleClasses, globalStyles,
userComponents, siteSettings, locales) + `content` (collections, entries).
Media isn't in this document — the bytes live on disk (`data/media/`) with metadata
in the `media` table, served at `/media/:id` (see Media above).

- Client: `src/composables/useProjectPersistence.ts` — `load()` fetches the
  document and hydrates every store; a debounced (800 ms) watcher autosaves any
  change via `PUT /api/project` (returns `SaveResult { ok, savedAt }`,
  server-stamped). **Autosave is the save** (Figma/Webflow model): there is one
  write path, `save()`, called by the debounced autosave, the first-run seed,
  `publish()` (to flush before snapshotting), and manual snapshots — it persists
  and advances `draftSavedAt`. There is **no manual Save button**. Exposes a
  module-level `saveState` ref (`'idle' | 'saving'`) — the brief in-flight
  transient behind the badge's "Saving…"; the resting badge is purely
  draft-vs-published (Draft / Saved / Live).
- `load()` runs after sign-in (boot if already authed, and after login/install).
  A fresh project (`design:null`) persists the current demo seed as its starting
  point, so a new install shows a real site.
- Each persisted store exposes a `hydrate()` action; `src/lib/ids.ts` mixes a
  per-load random token into generated ids so loaded ids never collide with
  ids created in the new session.
- Normalising `content` into queryable rows (for SSR filters) is deferred to
  the SSR slice.

## Dev workflow

- `npm run dev` runs **both** the Vite client (`dev:web`) and the API (`dev:server`, `tsx watch`) via `run-p`.
- **One origin in dev:** open `http://localhost:5173`. `/admin/` is the admin app (Vite `base: '/admin/'`; the router prefixes every route via `import.meta.env.BASE_URL`), and **`/` (plus every non-`/admin` path) is the published public site** — Vite proxies those, and `/api`, to Hono (`:3001`). So `:5173/` shows the live site right next to the editor at `:5173/admin/editor`, mirroring production (one origin: `/admin` = app, `/` = public). All Vite dev internals live under `/admin` (thanks to `base`), so the catch-all proxy leaves HMR alone.
- Same-origin → the session cookie flows without CORS. (Hono still listens directly on `:3001` too.)
- `npm run server:type-check` type-checks the server independently of `vue-tsc`.
- Reset the app to first-run: delete `data/superbird.db*`.

## Client integration (the seams)

The client never talks to storage directly — everything goes through two seams
that now `fetch` the API:

- `src/lib/api.ts` — `apiGet/apiPost` + `fetchSessionState()`.
- `src/lib/installer.ts` — `install()`.
- `src/lib/auth.ts` — `login()`, `logout()`.

Boot flow: `main.ts` awaits `fetchSessionState()` **before** installing the
router, hydrates the `setup` and `auth` stores, then mounts — so navigation
guards see real state on first paint. Stores are async and hydrate-based; no
more localStorage.

## Public SSR site + draft/publish

The Hono server has two faces on one port: `/api/*` (admin API) and a catch-all
**public site** (`server/routes/site.ts`) for every other path. In dev the
public site is `http://localhost:3001/` (`/about`, `/blog/<slug>`, …); the
editor SPA stays on Vite (`5173`). In production they're different domains.

- **Routing:** `/` → home page (slug `/`) · `/<slug>` → static page ·
  `/<collection.basePath>/<entry.slug>` → collection template + that entry ·
  else the `404` system page.
- **Rendering:** the server imports the shared pipeline via a `@/*` → `../src/*`
  tsconfig path alias (`server/tsconfig.json`; `dev:server` passes
  `--tsconfig`). It builds a DB-backed `RenderContext` and calls `renderDocument`.
- **Draft/publish (hybrid):** the public site serves the **published design
  snapshot** (`project_state.published_design`, written by `POST /api/publish`)
  plus **live entries filtered to `status:published`**. So content publishes
  instantly/independently while design changes stay private until Publish. An
  unpublished site shows a placeholder. Editor: the header **Publish** button
  (`useProjectPersistence().publish()`); `SessionState.publishedAt` +
  `SessionState.draftSavedAt` (draft `updated_at`) seed the header status badge
  (Live / Saved / Draft) on boot; autosave keeps `draftSavedAt` current in-session.
- Media resolves via `/media/:id` (see **Media** below), so published-site
  images render.

## Security & hardening

Layers on the admin surface (public forms/webhook/SSR are deliberately untouched):

- **Sessions** — `sb_session` httpOnly + `SameSite=Lax` (+ `Secure` in prod). TTL is **1 day** by default, **30 days** with login "remember me". `startSession` **rotates** (drops the incoming cookie's session first, killing fixation). `POST /api/logout-all` revokes **every** session for the user ("Log out all devices" in the app menu).
- **Two-factor (TOTP)** — opt-in per user (Settings › Security). `lib/totp.ts` implements RFC 6238 (SHA-1, 6 digits, 30s, ±1 window) over `node:crypto` — no dependency; the base32 secret is entered manually into an authenticator. Login becomes two-step: `/api/login` returns `{ twoFactorRequired, challenge }` (short-lived in-memory token, ≤5 tries) and `/api/login/2fa` completes it. Enrollment (`/api/2fa/setup|enable|disable`) issues **8 single-use recovery codes** (SHA-256-hashed at rest, shown once); disabling requires a current code. `users.totp_secret/enabled/recovery`; `User.twoFactorEnabled` flows to the client.
- **Rate limits** (`lib/rateLimit.ts`, in-memory fixed-window, keyed by `clientIp`): login (per-IP + per-account), install, backup import/restore, user create/delete, and a generic **1000/min per-IP `/api` ceiling** as a DoS backstop (well above autosave/boot traffic).
- **Trusted-origin guard** (`lib/originGuard.ts`) — CSRF hardening (see Stack). Belt-and-suspenders with `SameSite=Lax`.
- **Network lockdown** (`lib/ipAllow.ts`) — set `SUPERBIRD_ADMIN_ALLOW_IPS` to a comma list of exact IPs / IPv4 CIDRs (e.g. `127.0.0.1,10.0.0.0/8`). Enforced on `requireAuth` + login/install only. Unset = off. Env-based so a bad entry is never a permanent UI lockout.

**Deployment hardening (the real network boundary is the proxy, not the app):**
1. Bind Hono to loopback (`HOST=127.0.0.1` if wired, or firewall `:3001`) and put **nginx/Caddy** in front terminating **HTTPS** (sets `NODE_ENV=production` so cookies are `Secure`).
2. Have the proxy set `X-Forwarded-For` so `clientIp` (rate limits + `SUPERBIRD_ADMIN_ALLOW_IPS`) sees the real client.
3. For a private admin, restrict `/admin` + `/api` at the proxy (IP allow, VPN, basic-auth or mTLS) and/or set `SUPERBIRD_ADMIN_ALLOW_IPS` as a second in-app layer.
4. Set `siteSettings.deployment.url` (Settings › General) to your public URL so the origin guard trusts it and the dashboard shows it.

## Next slices

Responsive-visibility + interaction emission in the render pipeline; normalising
content into queryable rows if list filters outgrow in-memory scan; media
niceties (responsive variants/transforms). Migrations move from `ensureSchema`
to drizzle-kit (`npm run db:generate`) once the schema stabilises.
