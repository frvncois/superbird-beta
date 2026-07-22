# Render pipeline (node → HTML, classes → CSS)

> **Status: shipped for the editor preview.** Pure and framework-free, so the
> SSR public runtime (later slice) reuses it verbatim against DB-backed data.

The single faithful renderer the whole product derives from — the "emit real
output" counterpart to the editor's live `CanvasNodeRenderer`. It powers the
in-editor **Preview** now and the public site later.

## Modules — `src/lib/render/`

- `context.ts` — `RenderContext`: `{ content(node, entry?), mediaUrl(id), entriesFor(source, limit) }`. Abstracts the data source (stores in the editor; DB in SSR).
- `html.ts` — `renderNodeToHtml(node, ctx, entry?, repeated?)`. Real elements: `<a href/target/rel>`, `<img src/alt>` (src via `mediaUrl`), form controls, headings/lists/blockquote, `<button>`, iframe/video. **No inline `style`** — a styled node carries `data-sb-s="<node.id>"` (its CSS is emitted per-element by css.ts) plus class list; id/title/aria/validated custom attrs. Interactive nodes carry `data-sb-ix="<node.id>"`. Content resolved via `ctx.content` (entry- & locale-aware), HTML-escaped; markdown nodes run through `renderMarkdown`. Component instances render as containers; **collection-list** repeats its item template once per entry (`repeated` items suppress author `htmlId` to keep DOM ids unique).
- `css.ts` — `compilePageCss(body, …)` / `compileSiteCss(bodies, …)`. Emits `baseCss` — `@font-face` (self-hosted default + uploaded fonts), `:root` tokens, a **Preflight-style reset** (zeroes margin/padding/border everywhere, strips native button/form chrome and list markers; order matters: reset before typography before per-element rules), global typography — then **per-element rules keyed to `[data-sb-s="<node.id>"]`**, resolved from the node's class list in order (custom classes + base Tailwind utilities, last wins) exactly like the editor canvas (`lib/styles.resolveStyles`). Tablet/mobile deltas → `@media (max-width:768px|375px)`; custom states → `[data-sb-s]:hover/:focus/…`; Tailwind variants (`hover:`/`md:`/`dark:`) → pseudo / min-width `@media` with `!important`.
- `index.ts` — re-exports + `renderDocument(body, styleClasses, globalStyles, ctx, head?, assets?)` → a full HTML document. Self-contained by default (inline `<style>` + inline runtime/data, for the Preview iframe); with `assets.styleHref`/`scriptSrc` it links external files (the SSR site links a shared `/style.css` + `/script.js`).

## Editor preview

`src/components/preview/PreviewOverlay.vue` — a full-screen overlay with an
**iframe** (`srcdoc = renderDocument(...)`) so the compiled CSS/HTML is isolated
from editor styles. Desktop/tablet/mobile width toggles exercise the `@media`
rules. Opened via the header **Preview** button (`canvas.previewOpen`).

## Responsive visibility

`node.visibility.hide{Desktop,Tablet,Mobile}` → the renderer adds
`sb-hide-{desktop,tablet,mobile}` classes and `baseCss` emits three
non-overlapping `@media` utility rules (mobile ≤375, tablet 376–768, desktop
≥769; `display:none!important`).

## Interaction playback

Nodes with `interactions` are stamped `data-sb-ix="<node.id>"`; the actual
interaction data lives in `window.__SB_IX__` (keyed by node id) — inline for the
Preview, or in the shared `/script.js` for the SSR site — alongside
`interactionsRuntime.ts` (a vanilla-JS runtime, only shipped when the page uses
interactions). It's a hand-kept port of `lib/animations.ts` +
`useInteractionRunner`'s trigger switch (page-load / click / hover /
scroll-into-view / scroll-position), playing via `element.animate`. Runs in the
published site and the Preview iframe. **Keep it in sync with `animations.ts`.**

## Deferred

- **Content-conditional visibility** (`NodeVisibility.condition`, entry-field
  based) and the `class-change` interaction trigger — neither is implemented in
  the editor either.
