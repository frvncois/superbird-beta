# Stores

Six domain Pinia stores (composition `defineStore` with setup fn). **All mutations via actions** — undo depends on it. Dependency graph: `globalStyles → canvas → locales`, `userComponents → canvas`; `media`/`siteSettings` standalone.

## `useCanvasStore` — pages, node tree, selection, interactions

The largest store; owns everything that touches nodes.

- **Pages:** `pages`, `activePageId`, `activePage`, `pagesByType`, `setActivePage`, `addPage`, `removePage`, `renamePage`
- **Selection/drag:** `bodyNode`, `nodes`, `selectedNodeId`, `selectedNode`, `draggedNodeId`, `draggedComponentType`, `selectNode`, `setDraggedNode`, `setDraggedComponent`
- **Class ↔ node bindings:** `addClassToNode`, `removeClassFromNode`, `renameClass`, `deleteStyleClass` (the class *records* live in globalStyles; these wire nodes to them and walk all pages)
- **Node mutations:** `findNode`, `addNode`, `insertNode`, `moveNode`, `updateNode`, `removeNode`, `setNodeSettings`, `setCustomAttribute`, `removeCustomAttribute`
- **Clipboard/ops:** `clipboardNode`, `clipboardClasses`, `copyNode`, `pasteNode`, `duplicateNode`, `wrapInContainer`, `unwrapNode`, `moveUp`, `moveDown`, `copyClasses`, `pasteClasses`, `getNodeIndex`, `isContainerNode`, `getParentId`
- **Dynamic fields:** `activePageFields`, `getUsedDynamicFields`, `bindDynamicField`, `unbindDynamicField`, `addDynamicFieldElement`
- **Interactions** (state lives on nodes, so it's here): `getNodeInteractions`, `add/remove/updateInteraction`, `add/remove/updateStep`, `add/removeActionFromStep`, `updateActionInStep`
- **Localized content:** `getNodeContent`, `setNodeContent` (read `locales.activeLocale`)

Node settings edits (`visibility`, `link`, `accessibility`, `advanced`, `htmlId`, `htmlTitle`, `customAttributes`, `dynamicField`) → `setNodeSettings(id, partial)` (merge-partial). Don't mutate `selectedNode` directly.

## `useGlobalStylesStore` — design tokens + style classes

- **Tokens:** `globalStyles` (colors/fonts/sizes/typography), `globalCssVars` (computed `--global-*`), `setGlobalColor`/`removeGlobalColor`/`addGlobalColor`, `setGlobalFont`, `setGlobalSize`/`removeGlobalSize`/`addGlobalSize`, `updateTypography`, `updateHeadingStyle`
- **Panel:** `globalStylesPanelOpen`, `openPanel`, `closePanel`
- **Style classes:** `styleClasses`, `activeClassName`, `activeState`, `activeBreakpoint`, `activeViewportWidth`, `allClassNames`, `createStyleClass`, `updateClassStyle`, `setActiveState`, `setActiveBreakpoint`, `setActiveClass`
- **`resolveStyles(node, state?)`** — the canonical resolver: cascades desktop→tablet→mobile class styles, layers state over default, then instance styles. **Never reimplement this** (the canvas renderer used to, and dropped states).

## `useMediaStore`
`mediaItems`, `mediaFolders`, `mediaLibraryOpen`, `openLibrary`, `closeLibrary`, `addMediaItem(file)`, `removeMediaItem`, `updateMediaItem`, `moveMediaToFolder`, `add/remove/renameMediaFolder`

## `useSiteSettingsStore`
`siteSettings`, `updateSiteIdentity`, `updateSeo`, `updateCustomCode`, `add/removeRedirect`, `updateIntegrations`, `add/removeCustomFont`

## `useLocalesStore`
`locales`, `activeLocale`, `defaultLocale`, `isDefaultLocale`, `addLocale`, `removeLocale`, `setActiveLocale`

## `useCollectionsStore` — user-defined content types (in-app CMS, no persistence yet)
`collections`, `entries`; reads `collectionById`, `collectionByTemplatePage`, `entryById`, `entriesByCollection`, `schemaFor(body)` (derives a collection's fields from its template body — the placed dynamic-field nodes); CRUD `addCollection`/`renameCollection`/`removeCollection`, `addEntry`/`updateEntry`/`setEntryValue`/`removeEntry`. Standalone (imports no other store); collection *creation* is orchestrated in the UI (`canvas.addPage('collection')` + `addCollection`). Canvas reads it for entry-aware content: a collection's template is a Page (`pageType:'collection'`); `canvas.activeEntry` supplies field values, and `getNodeContent`/`setNodeContent` route a field-bound node's content to `entry.values[node.dynamicField]`. See `docs/cms-architecture.md`.

## `useUserComponentsStore`
`userComponents`, `createComponentFromNode`, `instantiateComponent`, `addComponentToPage`, `updateComponentDefinition`, `detachComponentInstance`, `deleteComponent`, `getComponentInstanceCount` (sync/detach walk `canvas.pages` via `lib/tree`)

## Undo-relevant state
Only these three refs are snapshotted by `useHistory`: `canvas.pages`, `globalStyles.styleClasses`, `userComponents.userComponents`. State that must be undoable belongs in one of them, mutated through an action.
