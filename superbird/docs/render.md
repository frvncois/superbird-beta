# Render pipeline (node → HTML, classes → CSS)

> **Status: shipped for the editor preview.** Pure and framework-free, so the
> SSR public runtime (later slice) reuses it verbatim against DB-backed data.

The single faithful renderer the whole product derives from — the "emit real
output" counterpart to the editor's live `CanvasNodeRenderer`. It powers the
in-editor **Preview** now and the public site later.

## Modules — `src/lib/render/`

- `context.ts` — `RenderContext`: `{ content(node, entry?), mediaUrl(id), entriesFor(source, limit) }`. Abstracts the data source (stores in the editor; DB in SSR).
- `html.ts` — `renderNodeToHtml(node, ctx, entry?)`. Real elements: `<a href/target/rel>`, `<img src/alt>` (src via `mediaUrl`), form controls, headings/lists/blockquote, `<button>`, iframe/video. Class list + inline `style` from `node.styles`; id/title/aria/custom attrs. Content resolved via `ctx.content` (entry- & locale-aware), HTML-escaped; markdown nodes run through `renderMarkdown`. Component instances render as containers; **collection-list** repeats its item template once per entry.
- `css.ts` — `compileCss(styleClasses, globalStyles)`. Emits `:root` tokens, a small reset, global typography, and per-class rules: `desktop.default` → `.name{}`, states → `.name:hover/:focus/:active{}`, tablet/mobile → `@media (max-width:768px|375px){}`. Same desktop→tablet→mobile cascade as `lib/styles.resolveStyles`, but as genuine rules instead of flattened inline styles.
- `index.ts` — re-exports + `renderDocument(body, styleClasses, globalStyles, ctx)` → a full standalone HTML document string.

## Editor preview

`src/components/preview/PreviewOverlay.vue` — a full-screen overlay with an
**iframe** (`srcdoc = renderDocument(...)`) so the compiled CSS/HTML is isolated
from editor styles. Desktop/tablet/mobile width toggles exercise the `@media`
rules. Opened via the header **Preview** button (`canvas.previewOpen`).

## Deferred

- **Responsive visibility hide** (`NodeVisibility.hide*`) — needs per-node
  `@media display:none` rules; not emitted yet.
- **Interaction playback** — the editor runs interactions at runtime; the
  published renderer doesn't emit them yet.
- **Sharing with the server** — the modules are framework-free but currently
  import via the `@/` alias; the SSR slice will make them importable server-side
  (relocate to `shared/` or expose a server-resolvable path).
