# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Superbird is a Vue 3 web application. All source code lives inside the `superbird/` subdirectory.

## Commands

All commands must be run from the `superbird/` directory.

```sh
npm run dev          # Start Vite dev server with HMR
npm run build        # Type-check (vue-tsc) then production build (vite build)
npm run build-only   # Production build without type-checking
npm run type-check   # Run vue-tsc type checking only
```

No test runner or linter is configured yet.

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
- `src/stores/` — Pinia stores using composition API pattern (`defineStore` with setup function)
- `src/App.vue` — Root component

Path alias: `@/` maps to `src/`.

## Design System

The full design system spec is in `superbird/DESIGN.md`. Key conventions:

- **Colors**: Use CSS custom properties (`bg-background`, `text-foreground`, `text-secondary`, `border-border`, etc.) — never hardcode hex values or use raw Tailwind color classes
- **Dark mode**: Class-based (`.dark` on `<html>`), all tokens auto-switch via CSS custom properties
- **Border radius**: `rounded-2xl` for containers, `rounded-xl` for inner controls, `rounded-lg` for small elements
- **Typography**: `font-sans` (Geist) for all text, `font-mono` (Geist Mono) for labels/badges/metadata
- **Labels/badges**: `text-[10px] font-mono uppercase tracking-wider`
- **Animations**: Use `superbird-*` keyframes (defined in `@theme`). Entrance easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Stagger with incrementing delays.
- **Status colors**: Map to semantic pairs (green/blue/purple/amber/red/orange/yellow/muted) via `bg-{name}-bg text-{name}-fg`
- **Icons**: `@heroicons/vue` outline 24px default
