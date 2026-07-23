# Architecture

Vue 3.5 (`<script setup lang="ts">`) · Vite 8 · Pinia 3 · Vue Router 5 · Tailwind v4. Path alias `@/` → `src/`. All source in `superbird/src/`.

## Dependency flow (one-directional)

```
types → constants → lib → stores → composables → components
```

A layer may only import from layers to its left. Enforced by convention, not tooling — respect it.

| Layer | Contains | May NOT |
|---|---|---|
| `types/` | Interfaces & type aliases only (`canvas.ts`, `contextMenu.ts`) | Contain runtime values |
| `constants/` | Runtime constant data, option arrays, inject keys | Import stores/components |
| `lib/` | Pure functions | Import Vue, stores, or touch the DOM |
| `stores/` | Pinia domain stores | Import components |
| `composables/` | Cross-feature reactive logic | — |
| `components/` | `.vue` by context | — |

## Folder map

```
components/
  ui/                 22 primitives (*Ui) + icons.ts registry — NEVER import stores
  header/             EditorHeader, HeaderPageSelect/LocaleSwitch/ViewportSwitch, SuperbirdIcon
  sidebar/
    CollapsibleSidebar.vue          shell shared by both sidebars
    layers/ elements/ components/    left-sidebar panels
    properties/                      SidebarProperties + 9 *Section.vue + useNodeStyles.ts
    settings/                        SidebarSettings + 10 *Block.vue + useNodeSettings.ts
    interactions/                    SidebarInteractions + List/Editor/Step/Action + ActionPickerPopover
  canvas/             EditorCanvas, CanvasNodeRenderer, NodePlaceholder, useNodeDnD.ts
  modals/
    global-styles/    GlobalStylesPanel + 6 *Tab.vue
    media-library/    MediaLibraryModal (title bar + search/type/sort/view controls) + Breadcrumb/Grid/DetailPanel (unified in-area folders+files, grid+list, DnD, context menu, private flag)
stores/               canvas globalStyles media siteSettings locales userComponents collections
lib/                  tree ids nodeFactory styles animations unitValue media siteDefaults
constants/            canvas.ts propertyOptions.ts injectionKeys.ts
composables/          useHistory useKeyboardShortcuts useContextMenu useNodeContextMenu useDragScrub useInteractionRunner
types/                canvas.ts contextMenu.ts
data/                 demo.ts (seed data only)
```

## Placement rules

- A `*Ui.vue` goes in `ui/` **only if app-agnostic** — no store imports, no domain types beyond generics.
- A component used by one feature lives in that feature's folder; shared across sidebars → `sidebar/` root; shared across contexts → promote to `ui/`.
- Feature composables co-locate (`properties/useNodeStyles.ts`, `canvas/useNodeDnD.ts`). Cross-feature composables → `composables/`.

## Store dependency graph (acyclic)

```
globalStyles → canvas → locales, collections
userComponents → canvas
media, siteSettings, collections → (nothing)
```
Never introduce a back-edge. If canvas needs something from userComponents, the logic belongs in `lib/tree` instead.

## Undo model

`useHistory` is a **module-scope singleton**. It snapshots three stores together — `canvas.pages`, `globalStyles.styleClasses`, `userComponents.userComponents` — and restores all three atomically inside one paused section. Consequences:
- Any state that must be undoable lives in one of those three refs.
- Every mutation of them must go through an action (a direct assignment escapes the snapshot debounce contract and can desync).

## Gotcha: sidebar panels render twice

`EditorView.vue` renders each sidebar panel **twice** — once inside `TabsUi` (expanded) and once as `CollapsibleSidebar`'s collapsed floating panel. Therefore panels must be fully **store-driven**: no component-local singletons, no hardcoded element `id`s, no `provide` that would collide between the two instances. Smoke-test both expanded and collapsed after touching a panel.

## Conventions checklist

- [ ] v-model via `defineModel()`; props via `withDefaults(defineProps<…>())`; events kebab-case
- [ ] State mutations through store actions only (incl. open/close flags → `openPanel()`, `closeLibrary()`)
- [ ] UI primitives import no stores — tokens via prop or `GlobalTokensKey` inject
- [ ] Node ids from `lib/ids`, nodes from `lib/nodeFactory`, tree walks via `lib/tree`
- [ ] Dropdown → `PopoverUi`, modal → `ModalUi`, icon → `IconUi`, micro-label → `LabelUi`, label+control row → `FieldRowUi`
- [ ] No raw `<input>/<select>/<textarea>/<button>` outside `components/ui/` (review flag)
- [ ] No hardcoded hex — use token classes ([design-tokens.md](design-tokens.md))

## Checks

`npm run build` (from `superbird/`) runs `vue-tsc` type-check then Vite build — the only gate. No test runner or linter configured.
