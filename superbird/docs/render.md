# Render pipeline (node → HTML, classes → CSS)

> **Status: shipped for the editor preview.** Pure and framework-free, so the
> SSR public runtime (later slice) reuses it verbatim against DB-backed data.

The single faithful renderer the whole product derives from — the "emit real
output" counterpart to the editor's live `CanvasNodeRenderer`. It powers the
in-editor **Preview** now and the public site later.

## Modules — `src/lib/render/`

- `context.ts` — `RenderContext`: `{ content(node, entry?), mediaUrl(id), entriesFor(source, limit) }`. Abstracts the data source (stores in the editor; DB in SSR).
- `html.ts` — `renderNodeToHtml(node, ctx, entry?)`. Real elements: `<a href/target/rel>`, `<img src/alt>` (src via `mediaUrl`), form controls, headings/lists/blockquote, `<button>`, iframe/video. Class list + inline `style` from `node.styles`; id/title/aria/custom attrs. Content resolved via `ctx.content` (entry- & locale-aware), HTML-escaped; markdown nodes run through `renderMarkdown`. Component instances render as containers; **collection-list** repeats its item template once per entry.
- `css.ts` — `compileCss(styleClasses, globalStyles)`. Emits `:root` tokens, a **Preflight-style reset** (zeroes margin/padding/border everywhere, strips native button/form chrome and list markers — so only design-system styles show; order matters: reset before typography before classes so each layers on top), global typography, and per-class rules: `desktop.default` → `.name{}`, states → `.name:hover/:focus/:active{}`, tablet/mobile → `@media (max-width:768px|375px){}`. Same desktop→tablet→mobile cascade as `lib/styles.resolveStyles`, but as genuine rules instead of flattened inline styles.
- `index.ts` — re-exports + `renderDocument(body, styleClasses, globalStyles, ctx)` → a full standalone HTML document string.

## Editor preview

`src/components/preview/PreviewOverlay.vue` — a full-screen overlay with an
**iframe** (`srcdoc = renderDocument(...)`) so the compiled CSS/HTML is isolated
from editor styles. Desktop/tablet/mobile width toggles exercise the `@media`
rules. Opened via the header **Preview** button (`canvas.previewOpen`).

## Responsive visibility

`node.visibility.hide{Desktop,Tablet,Mobile}` → the renderer adds
`sb-hide-{desktop,tablet,mobile}` classes and `compileCss` emits three
non-overlapping `@media` utility rules (mobile ≤375, tablet 376–768, desktop
≥769; `display:none!important`).

## Interaction playback

Nodes with `interactions` are stamped `data-sb-ix="<json>"`; `renderDocument`
injects `interactionsRuntime.ts` (a vanilla-JS `<script>`, only when the page
uses interactions). It's a hand-kept port of `lib/animations.ts` +
`useInteractionRunner`'s trigger switch (page-load / click / hover /
scroll-into-view / scroll-position), playing via `element.animate`. Runs in the
published site and the Preview iframe. **Keep it in sync with `animations.ts`.**

## Deferred

- **Content-conditional visibility** (`NodeVisibility.condition`, entry-field
  based) and the `class-change` interaction trigger — neither is implemented in
  the editor either.
