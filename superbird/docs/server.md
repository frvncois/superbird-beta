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

| Method + path | Purpose |
|---|---|
| `GET /api/session` | Boot state: `{ installed, project, user }` in one call |
| `POST /api/install` | First-run: create project + admin user, open session (409 if already installed) |
| `POST /api/login` | Verify credentials, open session |
| `POST /api/logout` | Destroy session |
| `GET /api/health` | Liveness |

## Dev workflow

- `npm run dev` runs **both** the Vite client (`dev:web`) and the API (`dev:server`, `tsx watch`) via `run-p`.
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

## Next slices

Per `cms-architecture.md`: content model tables + CRUD (collections/fields/
entries/media), then the shared render pipeline (node→HTML, classes→CSS), then
the SSR public runtime, then draft/publish. Migrations move from `ensureSchema`
to drizzle-kit (`npm run db:generate`) once the schema stabilises.
