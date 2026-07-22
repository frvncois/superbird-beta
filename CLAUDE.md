# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superbird is a Vue 3 web application. All source code lives inside the `superbird/` subdirectory.

## Dev reference library

`superbird/docs/` is a Claude-facing reference library — load the relevant file before working in that area (it is canonical; if code and a doc disagree, fix the doc):

- `docs/architecture.md` — layers, dependency flow, folder map, placement rules, the double-render gotcha
- `docs/design-tokens.md` — colors, typography, sizing vocabulary, motion, icons (never hardcode a value)
- `docs/ui-primitives.md` — catalog of every `*Ui` with props/model/variants
- `docs/stores.md` — public API of each domain store
- `docs/lib-and-composables.md` — pure helpers, constants, composables, types index
- `docs/patterns.md` — recipes for the recurring moves
- `docs/server.md` — backend tier (Hono + SQLite/Drizzle), API routes, client seams, dev workflow
- `docs/render.md` — faithful render pipeline (node→HTML, classes→CSS) + editor Preview

Start at `docs/README.md`. The design-system spec is `superbird/DESIGN.md`.

## Commands

All commands must be run from the `superbird/` directory.

```sh
npm run dev               # Run BOTH the Vite client (HMR) and the Hono API (tsx watch)
npm run dev:web           # Client only
npm run dev:server        # API only (http://localhost:3001; Vite proxies /api to it)
npm run build             # Type-check (vue-tsc) then production build (vite build) — client
npm run build-only        # Production build without type-checking
npm run type-check        # vue-tsc type checking (client)
npm run server:type-check # tsc type checking (server)
```

No test runner or linter is configured yet. Reset the app to first-run by deleting `data/superbird.db*`.

## Tech Stack

- **Vue 3.5** with `<script setup lang="ts">` single-file components
- **Vite 8** with `@tailwindcss/vite` plugin (Tailwind CSS v4)
- **Pinia 3** for state management (composition API style with `defineStore`)
- **Vue Router 5** with `createWebHistory`
- **TypeScript 6** — `noUncheckedIndexedAccess` is enabled

## Architecture

- `src/main.ts` — App entry: creates Vue app, installs Pinia + Router, imports global CSS
- `src/assets/main.css` — Tailwind v4 entrypoint with all design tokens (`@theme` block), dark mode overrides (`.dark` class), custom keyframes, and base reset
- `src/router/index.ts` — Router config (routes array, web history mode)
- `src/components/` — Organized by context:
  - `ui/` — Reusable primitives with `*Ui` suffix (ButtonUi, InputUi, PopoverUi, ModalUi, IconUi, …) plus the `icons.ts` glyph registry
  - `header/` — Editor top bar
  - `sidebar/` — `layers/`, `elements/`, `components/`, `properties/`, `settings/`, `interactions/`
  - `canvas/` — Artboard, node renderer, drag & drop
  - `modals/` — `global-styles/`, `media-library/`
- `src/stores/` — Domain Pinia stores (composition API `defineStore` with setup function): `canvas`, `globalStyles`, `media`, `siteSettings`, `locales`, `userComponents`. All mutations go through actions (undo/redo depends on it).
- `src/lib/` — Pure helper functions: `tree`, `ids`, `nodeFactory`, `styles`, `animations`, `unitValue`, `media`, `siteDefaults`
- `src/constants/` — `canvas.ts` (runtime constants), `propertyOptions.ts`, `injectionKeys.ts`
- `src/types/` — Types only: `canvas.ts`, `contextMenu.ts`
- `src/composables/` — Cross-feature composables: `useHistory` (singleton), `useKeyboardShortcuts`, `useContextMenu`, `useNodeContextMenu`, `useDragScrub`, `useInteractionRunner`. Feature-specific composables co-locate with their feature (e.g. `canvas/useNodeDnD.ts`).

Path alias: `@/` maps to `src/`.

### Backend tier

- `server/` — Hono API + SQLite (better-sqlite3 + Drizzle). Entry `server/index.ts` (port 3001). `db/` (client + schema), `lib/` (password scrypt, cookie sessions), `routes/auth.ts` (`/api/session|install|login|logout`). One DB file per project at `data/superbird.db` (git-ignored). Full detail in `docs/server.md`.
- `shared/types.ts` — canonical API contract shared by client (`@shared/*` alias) and server (relative import).
- Client seams: `src/lib/api.ts` (`fetchSessionState`, `apiGet/apiPost`), `src/lib/installer.ts` (`install`), `src/lib/auth.ts` (`login`/`logout`). `main.ts` awaits `fetchSessionState()` and hydrates the `setup`/`auth` stores **before** routing.

Component and coding conventions (defineModel, store-free UI primitives, primitive reuse rules) are documented in `superbird/DESIGN.md` under "Architecture & Conventions".

## Design System

The full design system spec is in `superbird/DESIGN.md`. Key conventions:

- **Colors**: Use CSS custom properties (`bg-background`, `text-foreground`, `text-secondary`, `border-border`, etc.) — never hardcode hex values or use raw Tailwind color classes
- **Dark mode**: Class-based (`.dark` on `<html>`), all tokens auto-switch via CSS custom properties
- **Border radius**: `rounded-2xl` for containers, `rounded-xl` for inner controls, `rounded-lg` for small elements
- **Typography**: `font-sans` (Geist) for all text, `font-mono` (Geist Mono) for labels/badges/metadata
- **Labels/badges**: `text-[10px] font-mono uppercase tracking-wider`
- **Animations**: Use `superbird-*` keyframes (defined in `@theme`). Entrance easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Stagger with incrementing delays.
- **Status colors**: Map to semantic pairs (green/blue/purple/amber/red/orange/yellow/muted) via `bg-{name}-bg text-{name}-fg`
- **Icons**: `IconUi` component rendering glyphs from the registry in `src/components/ui/icons.ts` — add new glyphs to the registry, never paste inline SVG in feature components
