# Design tokens

**Two token systems — do not confuse them.**

| System | Source | CSS vars | Consumed as | Scope |
|---|---|---|---|---|
| **Editor chrome** | `src/assets/main.css` `@theme` | `--color-*`, `--font-*`, `--ease-*`, `--animate-*` | Tailwind classes (`bg-foreground`, `text-red-fg`) | The app's own UI |
| **User site** | `globalStyles` store | `--global-*` (colors/sizes/fonts) | inline on `.canvas-artboard`; picked via `ColorInputUi`/`UnitInputUi` | The site the user is building |

This file documents the **editor-chrome** system — the one you use when building Superbird's UI. Never hardcode a hex value; use the class. The canvas artboard resets `--color-*` to fixed light values (`.canvas-artboard` in main.css), so editor tokens don't leak into the user's rendered page.

## Colors

**Core palette** — `bg-*` / `text-*` / `border-*`:

| Token | Light | Dark | Typical use |
|---|---|---|---|
| `background` | `#ffffff` | `#0a0a0a` | surfaces |
| `foreground` | `#0a0a0a` | `#fafafa` | primary text; `bg-foreground text-background` = dark "primary" button |
| `secondary` | `#a0a3a6` | `#626466` | muted text/icons; `hover:bg-secondary/10` = standard hover |
| `card` | `#f3f4f6` | — | raised cards |
| `border` | `#e5e7eb` | `#202224` | default border (applied to `*` in reset) |
| `primary` | `#6366f1` | — | accent; `bg-primary` (solid button), `text-primary`, `hover:bg-primary-hover` |
| `primary-hover` | `#818cf8` | — | accent hover |
| `icon-bg` / `icon-txt` | `#000` / `#fafafa` | `#1a1a1a` / — | icon chips |

**Semantic pairs** — status/category via `bg-{name}-bg text-{name}-fg`:

`green` `blue` `purple` `amber` `red` `orange` `yellow` `muted` — each has `-bg` and `-fg`.
`red` also has `-border` (`#fecaca`) and `-strong` (`#ef4444`). Used by `ButtonUi variant="danger"` (`border-red-border bg-red-bg text-red-fg`) and `IconButtonUi variant="danger"`.

**Score colors:** `score-green` `score-amber` `score-red` (raw `#22c55e`/`#f59e0b`/`#ef4444`).

Dark mode overrides only: `background foreground border secondary icon-bg muted-bg muted-fg red-bg red-border red-fg`. All others are shared. Toggled by `.dark` on `<html>` (from EditorHeader's theme button).

## Typography

- `--font-sans` = **Geist** (all text) · `--font-mono` = **Geist Mono** (labels/badges/metadata/code).
- Micro-label vocabulary (use `LabelUi`, don't hand-write):
  - default: `text-[10px] font-mono uppercase tracking-wider text-secondary`
  - `size="xs"`: `text-[9px] font-mono uppercase tracking-wider text-secondary/50`
  - tiniest inline data (token names): `text-[8px] font-mono`
- Body sizes: `text-sm` (default controls), `text-xs` (compact controls, the editor default).

## Sizing vocabulary (de-facto tokens, class strings)

Not in `@theme` but treated as canonical — match them, don't invent new values.

| Concern | Values |
|---|---|
| Control height | `h-12` lg input · `h-9` default button · `h-8` sm input/select/field-shell · `h-7` sm button / xs input / header controls · `h-6` xs |
| Radius | `rounded-2xl` containers/modals/dropdown panels/lg input · `rounded-xl` controls/inputs/buttons/popover panels · `rounded-lg` small/badges/xs · `rounded-md`/`rounded` tiny |
| Field label width | `w-12` (FieldRowUi sm) · `w-14` (md) · `w-16` (lg, default) |
| Input frame | `border border-foreground/15 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10` (encapsulated in InputUi and the field-shell primitives) |
| Hover row | `hover:bg-secondary/10` |

## Motion

- Easing: `--ease-spring` = `cubic-bezier(0.22,1,0.36,1)` (entrance) · `--ease-exit` = `cubic-bezier(0.4,0,1,1)`.
- `--animate-*` keyframe tokens: `intro-enter` `intro-exit` `fade-in` `fade-out` `fade-in-up` `skeleton-pulse` `modal-in`.
- Popover/dropdown transition (in `PopoverUi`): slide-fade `opacity-0 translate-y-1` → `opacity-100 translate-y-0`, 150ms enter / 100ms leave.
- Note: `hero-icon-enter/exit` keyframes and some `--animate-*` tokens are unused leftovers from the marketing-app lineage — don't build on them.

## Icons

Rendered only via `IconUi name="…"`. Glyphs are heroicons mapped in `components/ui/icons.ts` (the `ICONS` registry). **Add new glyphs to the registry — never paste `<svg>` inline.** Current keys:

`plus add close check home logout chevron-down chevron-right settings search users sparkles info alert check-circle lock sun moon folder upload download archive document globe arrow-right external-link analytics submissions trend-up trend-down eye preview desktop tablet mobile layers elements components component properties interactions layout position size spacing typography background border effects rename duplicate copy paste wrap unwrap move-up move-down classes delete select-parent section container columns column div heading text richtext markdown link link-block span list blockquote image video audio weight embed form input textarea select checkbox radio label button collection number date eye-slash swatch`
