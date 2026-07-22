# CMS & standalone architecture (design direction)

> **Status: agreed design direction — NOT yet implemented.** This is the target for turning Superbird from a WordPress plugin into a standalone app that owns its own CMS. The builder core (canvas, nodes, styles, components) is unchanged. When we build, this is the reference; update it as reality lands and delete the "planned" hedging per section as it ships.

## The shift

WordPress silently did two jobs Superbird never had to build: it was the **content database** (posts, products, categories, authors, custom fields) *and* the **admin UI** for editing that content. Superbird was only the presentation layer — templates binding to fields WP handed over.

Standalone, the builder core stays the same, but Superbird must now own the CMS half: content types, entries, taxonomies, storage, and — because it also **serves the published site** — a render runtime.

## Core model: everything is a collection

One unifying abstraction replaces today's hardcoded template/source split:

- **Collection** = a content type. Bundles three things: a **schema** (its fields), its **entries** (items), and its **single-item template** (the canvas you design). E.g. "Services", "Posts", "Products".
- **Entry** = one record: a bag of field values conforming to the collection's schema, with a slug and a draft/published status.
- **Taxonomies are just collections.** "Categories"/"Tags"/"Authors" are collections that other collections **reference**. No separate taxonomy concept — a `reference` field type points at another collection.

This collapses today's duplication (`PAGE_TYPE_CONFIGS` and `COLLECTION_SOURCES` both define "post fields") into one source of truth per collection.

## Storage — one SQLite file per project

Local-first, WordPress-style portability: **build locally, move the folder to a server, it runs.** SQLite delivers that (one file, no separate DB process). Postgres is a later opt-in for hosted/multi-user — it breaks "just move the folder", so it is not the default.

Everything lives in the one DB — **content and design**:

| Table | Holds |
|---|---|
| `collections` | id, name, singular/plural, base path (URL segment), → single-template ref |
| `fields` | id, collection_id, key, label, type, config (JSON), order |
| `entries` | id, collection_id, slug, status (draft/published), values (JSON), timestamps |
| `entry_references` | entry_id, field_key, target_entry_id — index maintained alongside the JSON so reference filters stay fast |
| design artifacts | pages, collection templates (node trees), style classes, components, global styles, site settings — all rows too |

**Generic + JSON, not per-collection tables.** User-defined schemas mean the DB shape is dynamic. Field *values* are stored as JSON per entry; schema edits (add/rename a field) are plain data writes, no migrations. The only place the generic model needs help is filtering by a reference — hence the small `entry_references` side index.

**Media is the exception to "everything in the DB":** large image/video blobs bloat and slow SQLite. Store media as **files in the project folder + paths/metadata in the DB**. Still moves with the folder; keeps the DB lean.

## Field types

Grows from today's set (`text | image | richtext | date | list | number | action`) to:

`text` · `richtext` · `number` · `date` · `boolean` · `option` (enum) · `image` (→ media library) · `reference` (single/multi → another collection) · `slug` · `color`

`list` becomes `reference` (multi) where it meant a taxonomy; the WP-ism `action` (add-to-cart) drops or becomes a button/link binding.

## Two faces over one model

- **Editor** — the builder as it exists, plus collection/field/entry management. Client SPA talking to an API. Sees drafts.
- **Public runtime (SSR)** — a Node server that reads the SQLite file, resolves a route → a page (or a collection template + entry) → renders HTML on request. Serves **only published**. This is the WordPress front-end equivalent; content changes are live without a rebuild.

### Shared render pipeline (the biggest new piece)

Both faces derive from the node model through **one** pipeline — the single most important thing to build:

1. **node tree → real HTML.** Today `CanvasNodeRenderer` is an *editor* view (contenteditable headings, image placeholders, links-as-divs, editor chrome). Publishing needs a *faithful* renderer: real `<img>` with actual media, real `<a>`, real form elements, no chrome.
2. **styleClasses → a real stylesheet.** Compile classes to actual CSS rules — breakpoints as `@media`, states as `:hover`/`:focus`/`:active` — instead of the editor's flattened inline styles. This is what finally makes the class system work as designed. (The cascade logic already exists in `lib/styles.resolveStyles`; the compiler is its "emit real rules" sibling.)

The same pipeline powers an accurate editor **preview** of published output.

## Editing model — inline on canvas (Option A)

When a collection's single template is open with an entry loaded as preview, edits route **by binding**:

- Editing a **field-bound** element (purple-ringed today) writes to **`entry.values[field]`** — you're editing that item's content.
- Editing anything **structural / styled / unbound** writes to the **template** — applies to *all* items of the collection.

The scaffolding already exists: nodes carry `dynamicField`, bound nodes get a purple ring, and `getNodeContent`/`setNodeContent` is the content path. The change is making that path **entry-aware**: if a node is field-bound and a preview entry is active, read/write the entry's value instead of the node's. Text and image fields edit cleanly inline; date/number/reference fields may still want a small inline control.

## Navigation & content management (UX)

Content lives in the existing **header page-select dropdown**, now grouped:

- **Pages** — regular pages (home, about, 404…).
- **Collections** — one row per collection. "Add" creates a collection (name it, e.g. "Services") → it appears here. Each row has a `>` chevron; hovering reveals a **submenu of that collection's items**, plus a **"new item"** action.
- Selecting an item loads it as preview data on the collection's single template (the canvas). Editing follows the Option-A routing above.

Defining a collection's **schema** (its fields) happens in a collection settings surface; those fields become the bindable options in the canvas for that collection's template.

## Listing, archives & routing

- **Listing is not a page type.** Drop the existing **collection-list** element onto any normal Page and point it at a collection. It gains real config: source collection, filter, sort, limit, pagination. Its inner item template (a `collection-item` with bound fields) repeats per entry; each item links to the entry's single page.
- **Category archives fall out for free.** Categories are a collection, so a category's *own* single template can hold a collection-list of (say) Services **filtered by the current entry**. `/services-category/plumbing` lists its services with no special-casing — this requires collection-list filters to understand "**the current entry**", not just static values. The separate `archive-template` page type is retired.
- **Routing:** static Pages by slug + dynamic collection singles at `<collection.basePath>/<entry.slug>` + collection-list queries. Slugs auto-generate from a title field, editable, unique per collection.

## Draft / Publish (hybrid)

A real draft→published distinction, scoped in two tiers:

- **Content:** each **entry** carries its own `draft | published` status. An author can publish one post without touching design; the runtime serves only published entries.
- **Design:** template / page / class / component edits sit in a **draft** and go live on a **site-level Publish** action — a half-finished redesign isn't instantly public.

This is roughly Webflow's behavior and keeps everyday content publishing lightweight while gating design changes. (Alternatives considered: content-only publish with instant-live design — simpler but leaks unfinished redesigns; whole-site snapshot publish for both — truer "nothing's live till I publish" but the DB must carry working + published copies of design *and* content.)

## How this maps onto today's code

| Today | Becomes |
|---|---|
| `constants/canvas.ts` → `PAGE_TYPE_CONFIGS`, `COLLECTION_SOURCES` (duplicated field lists) | a `collections` + `fields` model (DB-backed); the duplication disappears |
| `PageType` incl. `post-template`/`product-template`/`archive-template` | collection single-templates; archive retired (→ collection-list on a Page) |
| `dynamicField: string` on nodes | still a binding, resolved against the bound collection's schema + the active preview entry |
| `data/demo.ts` seed | seeded collections/fields/entries in the DB |
| Pinia stores fed by demo data | API-backed stores over the SQLite tier; new `collections`/`entries` stores |
| `canvas.getNodeContent/setNodeContent` | entry-aware read/write when a bound node has an active preview entry |
| `collection-list` node (placeholder) | real query config (source/filter/sort/limit/pagination) + settings UI + live entry rendering |
| — (new) | `lib/render` (node→HTML) and `lib/css` (styleClasses→stylesheet), shared by editor preview and SSR |
| — (new) | backend tier: Node server + SQLite + API; SSR route resolver; editor auth gate |

## Rough build order

1. **Collections model in-app** — ✅ shipped. `collections`/`fields`/`entries` as stores (seeded, pre-persistence); Pages\|Collections dropdown + item submenu; bind templates to collections; preview-entry selection; Option-A inline editing writing to entries. Retire the hardcoded configs.
2. **Persistence** — ✅ shipped. Auth/install (Hono + SQLite/Drizzle, session cookies); project persistence (whole project as one autosaved JSON document, `project_state`; `useProjectPersistence`); **media as files-on-disk + metadata rows** (`media`/`media_folders`, `data/media/`, served at `/media/:id`; `server.md`). Fresh installs seed from the demo. Deferred: normalising content into queryable rows (done lazily in-memory for now).
3. **Render pipeline** — ✅ shipped (editor preview). Pure `node→HTML` + `styleClasses→CSS` in `src/lib/render/`, driving an isolated iframe Preview; see `render.md`. Faithful real elements + real `@media`/state CSS. Remaining: share the modules with the SSR server, and add responsive-visibility + interaction emission.
4. **Public SSR runtime** — ✅ shipped. Hono catch-all route resolver (static pages + dynamic collection singles + collection-list) rendering via the shared pipeline; served on the API port, editor SPA separate. See `server.md`. (Collection-list current-entry filter for category archives still TODO.)
5. **Draft/Publish + auth** — ✅ shipped. Auth/login gate (slice 2) + the hybrid publish: public site serves the **published design snapshot** (site-level `POST /api/publish`) plus **live `status:published` entries**. Content publishes independently; design gated behind Publish.

## Open items (later)

- **Editor auth** — standalone needs a login gate for the builder, separate from the public site.
- **Media pipeline** — responsive variants / transforms, and exactly how files are laid out in the project folder.
- **Reference query performance** at scale — the `entry_references` index is the first answer; revisit if lists get large.
- **What is a "project" for versioning** — one DB file is portable; git-friendliness (JSON export of design) may be wanted later.
