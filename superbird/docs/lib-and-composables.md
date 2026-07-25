# lib, constants, composables, types

## `lib/` — pure functions (no Vue, no stores, no DOM)

**`tree.ts`** — the one place tree traversal lives. Prefer these over ad-hoc recursion.
- `walkTree(node, visitor)` — DFS; return `false` from visitor to skip children
- `findNode(tree, id)`, `findParent(tree, id)` → `{parent, index}`, `findParentNode(parent, id)`
- `renameClassInTree`, `removeClassFromTree`, `collectDynamicFields`, `clearComponentIds`, `countInstances`, `detachAllInstances`, `collectContentFromTree`, `collectContentOverrides`, `applyContentOverrides`, `syncInstancesInTree`

**`nodeFactory.ts`** — `createNode(type, overrides?)`, `deepCloneNode(node)`, `createPage(name, slug?, pageType?)`, `createStyleClassStyles()`. Nodes only come from here.

**`ids.ts`** — `createIdGenerator(prefix)` + named generators: `generateNodeId`, `generateComponentId`, `generatePageId`, `generateInteractionId`, `generateStepId`, `generateMediaId`, `generateFolderId`, `generateRedirectId`. IDs only come from here.

**`styles.ts`** — `resolveStyles(node, styleClasses, breakpoint, state?)` — pure resolver. The `globalStyles` store wraps it with its reactive state; use the store's `resolveStyles(node, state?)` from components.

**`unitValue.ts`** — `parseUnitValue(val, keywords?)` → `{num, unit}`; `stepUnitValue(e, unit, apply)` (arrow-key ±1 / shift ±10 / alt ±0.1). Shared by unit inputs & DragLabel.

**`animations.ts`** — `runStep`, `runStepsReverse`, `runAllSteps` (Web Animations API keyframe builders; used by `useInteractionRunner`).

**`media.ts`** — `getMediaTypeFromMime(mime)`, `formatFileSize(bytes)`. **`siteDefaults.ts`** — `createDefaultSiteSettings()`. **`datetime.ts`** — `timeAgo`/`timeAgoShort`, `formatDate(v, fallback?)`, `formatDateTime(v, fallback?)`. **`slug.ts`** — `slugify(value)`.

## `constants/`

- **`canvas.ts`** — runtime constants: `STYLE_STATES`, `BREAKPOINTS`, `TRIGGER_TYPES`, `TARGET_TYPES`, `ACTION_PROPERTIES`, `EASING_OPTIONS`, `DEFAULT_LOCALES`, `PAGE_TYPE_CONFIGS`, `COLLECTION_SOURCES`, `nodeDefaults`, `CONTAINER_TYPES`, `TEXT_EDITABLE_TYPES`, `FORM_CHILD_TYPES`, `PARENT_CONSTRAINTS`; helpers `getPageTypeConfig`, `getCollectionSource`, `getDynamicFieldsForPageType`, `getDynamicField`, `fieldTypeToNodeType`, `fieldTypeToTag`.
- **`propertyOptions.ts`** — the 18 `<select>` option arrays for SidebarProperties (`displayOptions`, `positionOptions`, `flexDirectionOptions`, … `cursorOptions`).
- **`injectionKeys.ts`** — `GlobalTokensKey: InjectionKey<ComputedRef<GlobalTokens>>` where `GlobalTokens = {colors, sizes}`. Provided once in `EditorView`; consumed by `ColorInputUi`/`UnitInputUi`.

## `composables/` (cross-feature)

| Composable | Signature → returns | Notes |
|---|---|---|
| `useHistory()` | → `{undo, redo, canUndo, canRedo}` | **module-scope singleton**; snapshots the 3 undo-stores |
| `useKeyboardShortcuts()` | side-effecting | Cmd+Z/⇧Z, delete, copy/paste/duplicate; mounts listeners |
| `useContextMenu()` | → `{visible, x, y, items, open(e, items), close}` | position/open state only |
| `useNodeContextMenu` | `buildNodeActions(node, 'canvas'\|'layers', callbacks?)`, `buildElementActions(type)`, `deleteNodeWithUndo(id)` | builds `ContextMenuItem[]`; `deleteNodeWithUndo` removes + shows an Undo toast (re-inserts via `store.restoreNode`) |
| `useToast()` | → `{toasts, success(msg,opts?), error(...), info(...), dismiss, runAction}` | **module-scope singleton**; queue rendered by `ToastHost` (mounted in `App.vue`). `opts.action = {label, handler}` = e.g. Undo; `opts.duration = 0` keeps it until dismissed |
| `useInteractionRunner(elRef, interactions)` | attaches WAAPI animations | targets `[data-canvas-node]` / `[data-canvas-scroll]` — keep those attrs on canvas markup |

**Feature-scoped composables** (co-located, not in `composables/`): `canvas/useNodeDnD.ts` (`useNodeDnD(node)` → drop handlers + `dropPosition`), `sidebar/properties/useNodeStyles.ts` (selected-node style editing surface), `sidebar/settings/useNodeSettings.ts` (node/type predicates + collection/field helpers).

## `types/`
- **`canvas.ts`** — all domain interfaces (types only): `CanvasNode`, `NodeType`, `StyleClass`, `StyleState`, `Breakpoint`, `Interaction`/`InteractionStep`/`InteractionAction`, `Page`, `PageType`, `DynamicField`, `GlobalStyles`, `TypographySettings`, `MediaItem`/`MediaFolder`, `Locale`, `UserComponent`, `SiteSettings`, node-settings sub-types, etc.
- **`contextMenu.ts`** — `ContextMenuItem` (`ContextMenuAction | ContextMenuSeparator`), `separator()`, `isSeparator()`, `filterMenuItems()`.
