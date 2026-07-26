# Stores

Eleven domain Pinia stores (composition `defineStore` with setup fn): `canvas`,
`globalStyles`, `userComponents`, `collections`, `locales`, `media`,
`siteSettings`, `submissions`, `setup`, `auth`, `mcp`. **All mutations via
actions** — undo depends on it. Dependency graph: `globalStyles → canvas`,
`locales → canvas`, `collections → canvas`, `userComponents → canvas`;
`media`/`siteSettings`/`submissions`/`setup`/`auth`/`mcp` standalone.

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
- **Dynamic fields:** `addDynamicField(fieldType, targetId?, position?)` — places a typed field element (a collection's schema is derived from the placed nodes, see `useCollectionsStore.schemaFor`)
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

## `useSetupStore` — install + publish state
`project`, `publishedAt`, `installing`, `error`, `isInstalled`, `isPublished`, `hydrate`, `markPublished`, `install`. Hydrated from `fetchSessionState()` in `main.ts` before routing.

## `useAuthStore` — admin session
`currentUser` (incl. `twoFactorEnabled`), `authenticating`, `error`, `isAuthenticated`, `canDesign` (role `admin` → may edit design vs. content only), `hydrate`, `login(email, password, remember?)` → `LoginResult` (`{user}` or `{twoFactorRequired, challenge}`), `verifyTwoFactor(challenge, code)`, `logout`, `logoutAll` (revoke every session), `setupTwoFactor`/`enableTwoFactor(code)`/`disableTwoFactor(code)` (Settings › Security). Admin identity only — customer auth is a fully separate space (server-side `customers`/`sb_customer`).

## `useMcpStore` — headless MCP bridge status
`connected`, `active`, `paused`, `lastAction`, `actionCount`, `setConnected`, `noteTool`, `release`, `pause`, `resume`. Surfaces live MCP-editor activity in the UI.

## Undo-relevant state
Only these three refs are snapshotted by `useHistory`: `canvas.pages`, `globalStyles.styleClasses`, `userComponents.userComponents`. State that must be undoable belongs in one of them, mutated through an action.
