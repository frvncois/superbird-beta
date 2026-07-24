# Backend tier (server / API / DB)

> **Status: shipped.** Auth/install, the whole-document project store
> (design + content: collections/entries live in the `project_state` JSON, not
> yet normalised into rows), media (files-on-disk + metadata), forms +
> submissions, the store/commerce tier (products, orders, customers, Stripe),
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

## Layout

```
server/
  index.ts            Hono app + @hono/node-server bootstrap (port 3001)
  db/
    client.ts         better-sqlite3 + drizzle instance; ensureSchema()
    schema.ts         Drizzle tables: projects, users, sessions, media, mediaFolders, backups, submissions, smtpConfig, projectState, storeConfig, products, orders, orderItems, customers, customerSessions
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
| `POST /api/login` | — | Verify credentials, open session |
| `POST /api/logout` | — | Destroy session |
| `GET /api/project` | ✓ | Load the project document (`{ design, content }`); `design:null` on a fresh project |
| `PUT /api/project` | ✓ | Upsert the project document |
| `POST /api/publish` | ✓ | Snapshot the working design as the live/published design |
| `GET /api/media` · `POST` · `PATCH/:id` · `DELETE/:id` | ✓ | Media metadata CRUD + upload (multipart) |
| `POST/PATCH/DELETE /api/media/folders[/:id]` | ✓ | Media folders |
| `GET /media/:id` | — | **Public** — stream a media file (private items → 404 unless authed) |
| `POST /api/public/forms` | — | **Public** — form submission (rate-limit + honeypot; save/email/webhook per server-side config) |
| `GET /api/forms/submissions` · `PATCH/:id` · `DELETE/:id` | ✓ | Submissions list (form/status/date/search filters), mark-seen, delete |
| `GET /api/forms/submitted-forms` | ✓ | Distinct forms with submissions (filter options) |
| `GET /api/forms/submissions/export` | ✓ | Scoped CSV/JSON export (rate-limited attachment) |
| `GET/PUT /api/forms/smtp` · `POST /api/forms/smtp/test` | ✓ | SMTP config (password write-only) + test email |
| `GET/PUT /api/store/config` | ✓ | Store toggle + currency + Stripe keys (secret/webhook write-only) |
| `GET /api/store/products` · `PUT` · `DELETE/:entryId` · `POST /:entryId/archive` | ✓ | Product commerce rows (price/stock/active), remove soft/hard, archive |
| `GET /api/store/orders` · `PATCH /:id` | ✓ | Orders list (status filter) + status transitions |
| `GET /api/store/customers` · `GET /:id/orders` | ✓ | Customers + per-customer order history |
| `POST /api/store/auth/{register,login,logout}` · `GET /session` | — | **Public** — customer auth (separate from admin `users`) |
| `GET /api/store/catalog` · `POST /store/checkout` · `POST /store/webhook` · `GET /store/order` | — | **Public** — storefront: catalog, Stripe Checkout, webhook, order lookup |
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
  change via `PUT /api/project`.
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
  (`useProjectPersistence().publish()`); `SessionState.publishedAt` drives the
  dashboard's published badge.
- Media resolves via `/media/:id` (see **Media** below), so published-site
  images render.

## Next slices

Responsive-visibility + interaction emission in the render pipeline; normalising
content into queryable rows if list filters outgrow in-memory scan; media
niceties (responsive variants/transforms). Migrations move from `ensureSchema`
to drizzle-kit (`npm run db:generate`) once the schema stabilises.
