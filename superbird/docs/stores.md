# Stores

Thirteen domain Pinia stores (composition `defineStore` with setup fn): `canvas`,
`globalStyles`, `userComponents`, `collections`, `locales`, `media`,
`siteSettings`, `submissions`, `comments`, `snapshots`, `setup`, `auth`, `mcp`. **All mutations via
actions** — undo depends on it. Dependency graph: `globalStyles → canvas`,
`locales → canvas`, `collections → canvas`, `userComponents → canvas`;
`media`/`siteSettings`/`submissions`/`comments`/`snapshots`/`setup`/`auth`/`mcp` standalone.

## `useCanvasStore` — pages, node tree, selection, interactions

The core store; owns everything that touches nodes. Three cohesive groups are
extracted into composables under `src/stores/canvas/` and spread back into the
store's return (so `store.copyNode` etc. are unchanged): `interactions.ts`
(interactions CRUD), `clipboard.ts` (clipboard + structural ops), and
`classBindings.ts` (class ↔ node wiring). Pages + node tree stay the core.

- **Pages:** `pages`, `activePageId`, `activePage`, `pagesByType`, `setActivePage`, `addPage`, `removePage`, `renamePage`
- **Selection/drag:** `bodyNode`, `nodes`, `selectedNodeId`, `selectedNode`, `draggedNodeId`, `draggedComponentType`, `selectNode`, `setDraggedNode`, `setDraggedComponent`
- **Class ↔ node bindings:** `addClassToNode`, `removeClassFromNode`, `renameClass`, `deleteStyleClass` (the class *records* live in globalStyles; these wire nodes to them and walk all pages)
- **Node mutations:** `findNode`, `addNode`, `insertNode`, `moveNode`, `updateNode`, `removeNode`, `setNodeSettings`, `setCustomAttribute`, `removeCustomAttribute`
- **Clipboard/ops:** `clipboardNode`, `clipboardClasses`, `copyNode`, `pasteNode`, `duplicateNode`, `wrapInContainer`, `unwrapNode`, `moveUp`, `moveDown`, `copyClasses`, `pasteClasses`, `getNodeIndex`, `isContainerNode`, `getParentId`
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
`siteSettings`, `updateSiteIdentity`, `updateDeployment` (public base URL / custom domain — shown on the dashboard InfoCard + trusted by the server origin guard), `updateSeo`, `updateCustomCode`, `add/removeRedirect`, `updateIntegrations`, `add/removeCustomFont`

## `useLocalesStore`
`locales`, `activeLocale`, `defaultLocale`, `isDefaultLocale`, `addLocale`, `removeLocale`, `setActiveLocale`

## `useCollectionsStore` — user-defined content types (in-app CMS)
`collections`, `entries`; reads `collectionById`, `collectionByTemplatePage`, `entryById`, `entriesByCollection`, `schemaFor(body)` (derives a collection's fields from its template body — the placed dynamic-field nodes); CRUD `addCollection`(`{name, templatePageId}`)/`renameCollection`/`removeCollection`, `addEntry`/`updateEntry`/`setEntryValue`/`removeEntry`. Standalone (imports no other store); collection *creation* is orchestrated in the UI (`canvas.addPage('collection')` + `addCollection`). Canvas reads it for entry-aware content: a collection's template is a Page (`pageType:'collection'`); `canvas.activeEntry` supplies field values, and `getNodeContent`/`setNodeContent` route a field-bound node's content to `entry.values[node.dynamicField]`. See `docs/cms-architecture.md`.

## `useUserComponentsStore`
`userComponents`, `createComponentFromNode`, `instantiateComponent`, `addComponentToPage`, `updateComponentDefinition`, `detachComponentInstance`, `deleteComponent`, `getComponentInstanceCount` (sync/detach walk `canvas.pages` via `lib/tree`)

## `useSubmissionsStore` — form submissions (admin)
API-backed. `items`, `forms`, `loading`, `loaded`, `load`, `loadForms`, `markSeen`, `remove`. Read-only view of the server's `submissions` table (never served publicly).

## `useCommentsStore` — canvas comment threads (editor-only)
API-backed (`/api/comments`, own table). `items`, `loading`, `loaded`, `load`, `create(input)`, `setResolved`, `edit`, `addReply`, `removeReply`, `remove`, getters `byPage`/`openByPage`/`unresolvedCount`, and a `focusRequest`/`requestFocus`/`clearFocus` channel (header inbox → canvas: scroll to + open a thread). Each comment is a pin anchored to a node via `{nodeId, nx, ny}` (normalized offset) so it follows the element. **Never** in the project doc, publish snapshot, backups, or undo — a server-side collaboration surface for logged-in users only. Also exports `commentInitials(name)`. Boot-loaded in `main.ts` under the signed-in gate (alongside `media`).

## `useSnapshotsStore` — version history (editor-only)
API-backed (`/api/snapshots`, own table). `items` (metadata, newest-first), `loading`, `loaded`, `load`, `create({reason,label?})` (server dedups by content hash → `deduped` flag; unshifts only when a row was made), `restore(id)` (→ server overwrites the working doc with a safety-snapshot first, then re-hydrates via `useProjectPersistence().load()` + `useHistory().reset()`), `remove`, `setPinned`, `openPreview(id)`/`closePreview`/`previewDoc`/`previewMeta` (drives `SnapshotPreviewOverlay`), getter `grouped` (by day). Auto-triggered on editor open, publish, every ~20 autosaves / 10 min, and around MCP sessions (server-side). Smart-cap retention: pinned + manual/publish kept; newest 15 auto/open/mcp kept; hard cap 50. Never in the project doc, publish snapshot, portable export, or undo.

## `useSetupStore` — install + publish state
`project`, `publishedAt`, `draftSavedAt`, `installing`, `error`, `isInstalled`, `isPublished`, `hasUnpublishedChanges` (saved draft newer than the published snapshot), `hydrate`, `markPublished`, `markSaved`, `install`. Hydrated from `fetchSessionState()` in `main.ts` before routing.

## `useAuthStore` — admin session
`currentUser` (incl. `twoFactorEnabled`), `authenticating`, `error`, `isAuthenticated`, `canDesign` (role `admin` → may edit design vs. content only), `hydrate`, `login(email, password, remember?)` → `LoginResult` (`{user}` or `{twoFactorRequired, challenge}`), `verifyTwoFactor(challenge, code)`, `logout`, `logoutAll` (revoke every session), `setupTwoFactor`/`enableTwoFactor(code)`/`disableTwoFactor(code)` (Settings › Security). Admin identity only.

## `useMcpStore` — headless MCP bridge status
`connected`, `active`, `paused`, `lastAction`, `actionCount`, `setConnected`, `noteTool`, `release`, `pause`, `resume`. Surfaces live MCP-editor activity in the UI.

## Undo-relevant state
Only these three refs are snapshotted by `useHistory`: `canvas.pages`, `globalStyles.styleClasses`, `userComponents.userComponents`. State that must be undoable belongs in one of them, mutated through an action.
