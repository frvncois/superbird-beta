# Backend tier (server / API / DB)

> **Status: first slice shipped — auth/install only.** Content tables
> (collections, fields, entries, media), the render pipeline, and SSR are not
> built yet (see `cms-architecture.md` build order steps 3–5).

The standalone backend that replaces WordPress's database + admin API. Same
repo as the Vue client; shares TypeScript types via `@shared`.

## Stack

- **Hono** (`server/`) — the HTTP/API layer; will also host the public SSR runtime later.
- **SQLite via better-sqlite3 + Drizzle ORM** — one file per project at `data/superbird.db` (git-ignored). "Move the folder, it runs."
- **Node `scrypt`** for password hashing (no native/3rd-party crypto dep).
- **Cookie sessions** — opaque token in a `sb_session` httpOnly cookie, rows in the `sessions` table.

## Layout

```
server/
  index.ts            Hono app + @hono/node-server bootstrap (port 3001)
  db/
    client.ts         better-sqlite3 + drizzle instance; ensureSchema()
    schema.ts         Drizzle tables: projects, users, sessions
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
| `GET /api/health` | — | Liveness |
| `GET /*` (non-`/api`) | — | **Public SSR site** — resolves the URL and returns rendered HTML |

## Project persistence

The whole editable project is **one JSON document** per project (`project_state`
table, one row). It holds `design` (pages, styleClasses, globalStyles,
userComponents, siteSettings, locales) + `content` (collections, entries).
Media is **not** persisted yet (files-on-disk pipeline is a later slice).

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
- **Admin app:** `http://localhost:5173/admin/` (Vite `base: '/admin/'`; the router prefixes every route via `import.meta.env.BASE_URL`). **Public site:** `http://localhost:3001/`. In production `/admin` serves the built SPA and `/` the public SSR site from one origin.
- Vite proxies `/api` → `http://localhost:3001`, so requests are same-origin and the session cookie flows without CORS.
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
- **Known gap:** media isn't persisted, so `<img>` src resolves empty on the
  public site until the media pipeline lands.

## Next slices

Media as files-on-disk + a metadata table (unblocks real images on the public
site); responsive-visibility + interaction emission in the render pipeline;
normalising content into queryable rows if list filters outgrow in-memory scan.
Migrations move from `ensureSchema` to drizzle-kit (`npm run db:generate`) once
the schema stabilises.
