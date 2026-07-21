# Superbird dev reference

Claude-facing reference library. Load the relevant file when working in that area — each is canonical, terse, and kept in sync with the code. If code and a doc disagree, the code wins; fix the doc.

| File | Read it when… |
|---|---|
| [architecture.md](architecture.md) | Placing a new file, deciding what imports what, understanding the layer rules or the double-render gotcha |
| [design-tokens.md](design-tokens.md) | Choosing a color, size, radius, height, motion, or icon — anything you might be tempted to hardcode |
| [ui-primitives.md](ui-primitives.md) | Building UI — the catalog of every `*Ui` with props, model, variants |
| [stores.md](stores.md) | Reading or mutating app state — the public API of each domain store |
| [lib-and-composables.md](lib-and-composables.md) | Reaching for a pure helper, constant, composable, or type |
| [patterns.md](patterns.md) | Doing a recurring task — recipes for the common moves |

**The five rules that override instinct** (full list in architecture.md):
1. All state mutations go through store **actions** — never assign `store.x = y` or mutate a node from a getter. Undo depends on it.
2. UI primitives in `components/ui/` **never import stores**. Tokens arrive via props or `GlobalTokensKey` inject.
3. `defineModel()` for every v-model; `withDefaults(defineProps<…>())` for props.
4. Never paste raw SVG, hex colors, or a hand-rolled dropdown/modal — use `IconUi`, token classes, `PopoverUi`/`ModalUi`.
5. `lib/` is pure (no Vue, no stores, no DOM); `constants/` is data; `types/` is types only.
