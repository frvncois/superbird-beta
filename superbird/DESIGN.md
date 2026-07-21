# Superbird Design System

Reference for the Superbird editor's visual style and UI primitives.

---

## 1. Foundations

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `'Geist', sans-serif` | All body text, headings, buttons |
| `--font-mono` | `'Geist Mono', monospace` | Labels, badges, units, shortcuts, class names |

Font loaded from Google Fonts: `Geist:wght@100..900` + `Geist Mono:wght@100..900`.

**Type scale (editor UI):**

| Context | Class |
|---------|-------|
| Body / control text | `text-xs` (buttons `sm`, inputs, selects, menu items, tabs) |
| Default button text | `text-sm` |
| Section titles | `text-[10px] font-medium text-foreground` (PropertySectionUi) |
| Micro label | `text-[10px] font-mono uppercase tracking-wider text-secondary` (LabelUi) |
| Tiny label | `text-[9px] font-mono uppercase tracking-wider text-secondary/50` (LabelUi `size="xs"`) |
| Metadata / shortcuts | `text-[10px] font-mono text-secondary` |

### Colors

#### Core palette (light mode defaults)

| Token | Hex | Role |
|-------|-----|------|
| `--color-background` | `#ffffff` | Page background |
| `--color-foreground` | `#0a0a0a` | Primary text, default button fill |
| `--color-secondary` | `#a0a3a6` | Subdued text, descriptions |
| `--color-card` | `#f3f4f6` | Card backgrounds (rarely used directly) |
| `--color-border` | `#e5e7eb` | All borders via `*, *::before, *::after { border-color }` |
| `--color-icon-bg` | `#000000` | Icon container background |
| `--color-icon-txt` | `#FAFAFA` | Icon container text/icon color |
| `--color-primary` | `#6366f1` | Indigo accent (`solid` buttons, active/selected states) |
| `--color-primary-hover` | `#818cf8` | Indigo accent hover |

#### Dark mode overrides (`.dark` on `<html>`)

| Token | Hex |
|-------|-----|
| `--color-background` | `#0a0a0a` |
| `--color-foreground` | `#fafafa` |
| `--color-border` | `#202224` |
| `--color-secondary` | `#626466` |
| `--color-icon-bg` | `#1a1a1a` |
| `--color-muted-bg` | `#212222` |
| `--color-muted-fg` | `#6e737d` |
| `--color-red-bg` | `#2d1515` |
| `--color-red-border` | `#5c2222` |
| `--color-red-fg` | `#fca5a5` |

Dark mode is class-based only (no `prefers-color-scheme`), toggled from EditorHeader (`classList.toggle('dark')` on `<html>`). Default is light.

The `.canvas-artboard` class re-pins background/foreground/border/secondary to light values so the user's site preview is isolated from the editor theme.

#### Semantic color pairs (bg + fg)

Each semantic color defines a background and foreground pair, used via `bg-{name}-bg text-{name}-fg`.

| Name | Background | Foreground | Usage |
|------|-----------|------------|-------|
| Green | `#dcfce7` | `#29c965` | Success, good status |
| Blue | `#dbeafe` | `#1d4ed8` | Info |
| Purple | `#f3e8ff` | `#7e22ce` | Purple badges |
| Amber | `#fef3c7` | `#b45309` | Warnings |
| Red (bg/border/fg) | `#fef2f2` / `#fecaca` / `#b91c1c` | -- | Errors, danger buttons/menu items |
| Red strong | -- | `#ef4444` | Strong error indicator |
| Orange | `#ffedd5` | `#c2410c` | Orange badges |
| Yellow | `#fef9c3` | `#a16207` | Yellow badges |
| Muted | `#f3f4f6` | `#8d939e` | Default/neutral state |

Score colors also exist: `--color-score-green` `#22c55e`, `--color-score-amber` `#f59e0b`, `--color-score-red` `#ef4444`.

### Border Radius

| Context | Radius |
|---------|--------|
| Modals, large containers | `rounded-2xl` |
| Inputs (h-8), buttons, popover panels, context menus, segmented controls | `rounded-xl` |
| Small controls (`xs` inputs, `sm` icon buttons, popover items, swatches) | `rounded-lg` |
| Chips, unit menu items | `rounded-md` |
| Toggle track/thumb, state dots | `rounded-full` |

Rule of thumb: `rounded-2xl` for containers, `rounded-xl` for inner controls, `rounded-lg` for small elements.

### Borders & focus

All elements inherit `border-color: var(--color-border)` from the base reset.

**Canonical input spec** (InputUi, TextareaUi, SelectUi, and composite input shells like ColorInputUi/UnitInputUi):

```
border border-foreground/15 focus:border-foreground/40
outline-3 outline-transparent focus:outline-secondary/10
```

Composite shells use the `focus-within:` variants of the same classes. Container hover: `hover:border-foreground/20` (or `/25` on class input).

---

## 2. Architecture & Conventions

### Folder layout

```
src/
  components/
    ui/          Reusable primitives (*Ui suffix) + icons.ts registry
    header/      Editor top bar
    sidebar/     layers/ elements/ components/ properties/ settings/ interactions/
    canvas/      Artboard, node renderer, drag & drop
    modals/      global-styles/ media-library/
  stores/        Pinia stores per domain: canvas, globalStyles, media,
                 siteSettings, locales, userComponents
  lib/           Pure functions only (tree, ids, nodeFactory, styles,
                 animations, unitValue, media, siteDefaults)
  constants/     canvas.ts, propertyOptions.ts, injectionKeys.ts
  types/         Types only (canvas.ts, contextMenu.ts)
  composables/   Cross-feature composables; feature-specific ones
                 co-locate with their feature (e.g. canvas/useNodeDnD.ts)
```

### Rules

- **Naming**: UI primitives use the `*Ui` suffix (`ButtonUi`, `InputUi`, ...), one per file in `components/ui/`.
- **v-model**: always `defineModel()` (never manual `modelValue` prop + emit).
- **Props**: `withDefaults(defineProps<{...}>(), {...})`.
- **Stores**: all mutations go through store actions — undo/redo depends on it. Never write store state from components.
- **No stores in primitives**: `components/ui/` never imports stores. Global design tokens reach ColorInputUi/SizeTokenInputUi via `GlobalTokensKey` provide/inject (`constants/injectionKeys.ts`).
- **Use the primitives**: every dropdown is built on PopoverUi, every modal on ModalUi, every icon via IconUi, every micro-label via LabelUi, every label+control row via FieldRowUi.
- **Review flag**: a raw `<input>`, `<select>`, `<textarea>`, or `<button>` outside `components/ui/` is a signal to reach for a primitive instead.

---

## 3. UI Primitives (`src/components/ui/`)

### ButtonUi

Renders `<button>` or `<RouterLink>` (via `to` prop). Props: `variant`, `size`, `to`, `disabled`.

| Size | Classes |
|------|---------|
| `default` | `h-9 px-4 text-sm rounded-xl` |
| `sm` | `h-7 px-3 text-xs rounded-xl` |

| Variant | Style |
|---------|-------|
| `default` | `bg-foreground text-background hover:bg-foreground/85` |
| `solid` | `bg-primary text-white hover:bg-primary-hover` |
| `outline` | `bg-transparent border text-foreground hover:bg-secondary/10` |
| `ghost` | `bg-transparent text-foreground hover:bg-secondary/10` |
| `danger` | `border border-red-border bg-red-bg text-red-fg hover:bg-red-bg/70` |

Base: `inline-flex items-center justify-center font-medium cursor-pointer gap-1.5`, color transitions at 250ms. Disabled: `pointer-events-none opacity-50`.

### IconButtonUi

Square icon-only button. Props: `size`, `variant`, `title`, `disabled`.

| Size | Classes |
|------|---------|
| `default` | `size-7 rounded-xl` |
| `sm` | `size-5 rounded-lg` |
| `xs` | `size-4 rounded` |

Variants: `default` (`text-secondary hover:bg-secondary/10 hover:text-foreground`), `danger` (`hover:bg-red-bg hover:text-red-fg`).

### InputUi

Text input, `defineModel<string>`. Props: `placeholder`, `size` (defaults to `sm`), `type` (defaults to `text`).

| Size | Classes |
|------|---------|
| `default` | `h-12 px-3 text-sm rounded-2xl` |
| `sm` | `h-8 px-2.5 text-xs rounded-xl` |
| `xs` | `h-7 px-2 text-xs rounded-lg` |

Always: `w-full bg-transparent text-foreground placeholder:text-foreground/40` + the canonical border/focus spec.

### TextareaUi

`defineModel<string>`. Props: `placeholder`, `rows` (3), `mono` (adds `font-mono`). `rounded-xl px-2.5 py-2 text-xs resize-none` + canonical border/focus spec.

### SelectUi

Native select, `defineModel<string>`. Prop: `options: { value, label }[]`. `h-8 rounded-xl px-2.5 text-xs appearance-none` + canonical border/focus spec.

### ToggleUi

Switch, `defineModel<boolean>`, `role="switch"`. Track: `h-5 w-9 rounded-full`, on `bg-foreground`, off `bg-foreground/20`. Thumb: `size-4 rounded-full bg-background shadow`, `translate-x-4` when on.

### TabsUi

Tab bar + directional slide-fade content. Props: `tabs: { key, label }[]`; `defineModel<string>` for the active key (falls back to first tab). Content goes in a named slot per tab key.

Tab button: `px-3 py-2 text-xs`; active `text-foreground font-medium`, inactive `text-secondary hover:text-foreground`. Content slides 12px left/right by tab direction: enter 250ms ease-out, leave 200ms ease-in.

### SegmentedControlUi

Segmented selector, `defineModel<string>`. Props: `options: { value, label?, title? }[]`, `size` (`default` | `xs`), `grow`. Optional `#option` slot (receives `option`, `active`) for icon segments.

Container: `bg-foreground/5 p-0.5` (`rounded-xl`, or `rounded-md` for `xs`). Active segment: `bg-background text-foreground shadow-sm`; inactive: `text-secondary hover:text-foreground`. `xs` uses `text-[9px] font-mono`.

### PopoverUi

Anchored popover — render inside a `relative` container. `defineModel('open')` boolean. Props: `align` (`left` | `right` | `full`), `panelClass` (default `p-1`).

Provides the click-away backdrop, panel shell (`absolute top-full mt-1 rounded-xl border bg-background shadow-lg`) and the standard slide-fade transition: enter 150ms ease-out from `opacity-0 translate-y-1`, leave 100ms ease-in. All dropdowns build on this.

### ModalUi

Teleported to `<body>`. `defineModel('open')` boolean. Props: `position` (`center` | `right` drawer), `panelClass`.

Backdrop: `bg-foreground/20 backdrop-blur-sm`, click to close. Panel: `border bg-background shadow-lg`; center = `rounded-2xl` in padded viewport, right = full-height drawer. Fade 200ms in / 150ms out.

### LabelUi

Micro-label span. Prop: `size` — `default` (`text-[10px] font-mono uppercase tracking-wider text-secondary`) or `xs` (`text-[9px] ... text-secondary/50`).

### FieldRowUi

Label + control row: fixed-width label, slot for the control. Props: `label`, `labelWidth` (`sm` w-12 | `md` w-14 | `lg` w-16, default `lg`). Label: `text-[10px] text-secondary`.

### EmptyStateUi

Centered placeholder text. Props: `message` (or default slot), `compact` (`py-6` vs `py-12`). `text-xs text-secondary`.

### IconUi

Renders a 20×20 `fill="currentColor"` glyph from the `ICON_PATHS` registry in `icons.ts`. Props: `name` (registry key), `size` (Tailwind class, default `size-3.5`).

**All icons live in `src/components/ui/icons.ts`** — keyed path data covering sidebar tabs, node types, property sections, and context-menu actions, with shared constants for reused glyphs. New glyphs go in the registry; never paste inline `<svg>` markup in feature components.

### ColorInputUi

Color field, `defineModel<string>`. Props: `placeholder`, `tokens?` (falls back to `GlobalTokensKey` inject). `h-8 rounded-xl` shell with swatch button + text input; PopoverUi panel offers global palette swatches (writes `var(--global-<name>)`) and a native color picker.

### UnitInputUi

CSS length field, `defineModel<string>` (e.g. `"12px"`). Props: `placeholder`, `units` (default `px % em rem vw vh`), `allowAuto`. Number input + unit dropdown (PopoverUi); arrow keys step the value via `stepUnitValue` from `@/lib/unitValue`.

### SizeTokenInputUi

UnitInputUi plus global size tokens. Extra prop: `tokens?` (falls back to `GlobalTokensKey` inject). Tag button opens a token list; picking one writes `var(--global-size-<name>)` and shows a dismissible `bg-primary/15 text-primary` badge instead of the number input.

### LinkedUnitInputUi

Four-sided value (`defineModel<[string, string, string, string]>`, T/R/B/L) with a link toggle: linked = one SizeTokenInputUi drives all sides; unlinked = 2×2 grid of per-side inputs. Props: `labels` (default `['T','R','B','L']`), `units`, `allowAuto`.

### DragLabelUi

Wraps a label in a `cursor-ew-resize` span; horizontal pointer drag scrubs the numeric part of the `defineModel<string>` unit value. Prop: `sensitivity` (Shift = ×10, Alt = ×0.1). Text turns `text-primary` while dragging.

### PropertySectionUi

Collapsible section for the properties sidebar. Props: `title`, `icon` (registry name, falls back to `settings`), `statesWithValues` (StyleState dots colored via `STYLE_STATES`), `defaultOpen` (true). Header: `size-3.5` icon + `text-[10px] font-medium` title + rotating chevron; `border-b border-foreground/8` between sections.

### ClassInputUi

Style-class chip input with autocomplete. Props: `classes`, `activeClass`, `allClassNames`; `defineModel('activeState')` for the StyleState mini-dropdown; emits `add` / `remove` / `select`. Chips: `rounded-md text-[10px] font-mono`, active = `bg-primary/15 text-primary`. Enter adds, Backspace on empty removes last; dropdown suggests existing classes or offers "Create".

### ContextMenuUi

Teleported right-click menu at `x`/`y` (clamped to the viewport). Props: `items: ContextMenuItem[]` (from `@/types/contextMenu`; supports separators, `danger`, `disabled`, `shortcut`, `icon`); emits `close`. Escape and backdrop click close. Panel: `min-w-44 rounded-xl border bg-background p-1 shadow-lg` with a 100ms scale-fade. Item icons resolve through the IconUi registry.

---

## 4. Animation System

### Keyframes (defined in `@theme`, `main.css`)

| Name | From | To |
|------|------|----|
| `superbird-intro-enter` | `opacity:0; translateY(0.25em)` | `opacity:1; translateY(0)` |
| `superbird-intro-exit` | `opacity:1; translateY(0)` | `opacity:0; translateY(-0.25em)` |
| `superbird-fade-in` / `-out` | opacity 0↔1 | -- |
| `superbird-fade-in-up` | `opacity:0; translateY(10px)` | `opacity:1; translateY(0)` |
| `superbird-skeleton-pulse` | `opacity:0.5 -> 0.9 -> 0.5` | loop |
| `superbird-modal-in` | `opacity:0; translateY(-10px) scale(0.97)` | `opacity:1; scale(1)` |

### Easing & durations

| Context | Value |
|---------|-------|
| Entrance (spring-like) | `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-spring`), 400-600ms |
| Exit (accelerate out) | `cubic-bezier(0.4, 0, 1, 1)` (`--ease-exit`), 250-300ms |
| Hover/focus transitions | `ease`, 100-250ms |
| Tab slide-fade | 250ms in / 200ms out |
| Popover show/hide | 150ms in / 100ms out |
| Context menu | 100ms scale-fade |

### Standard transitions

- **Dropdowns**: the slide-fade baked into PopoverUi (`opacity-0 translate-y-1` -> `opacity-100 translate-y-0`, 150/100ms).
- **Modals**: fade via ModalUi (200/150ms).
- **Tab content**: directional 12px slide via TabsUi.
- **Stagger**: incrementing `animation-delay` inline styles with `superbird-fade-in-up` / `superbird-intro-enter`.

---

## 5. Patterns & Conventions

### Interaction states

| State | Pattern |
|-------|---------|
| Hover (clickable) | `hover:bg-secondary/10`; default buttons `hover:bg-foreground/85` |
| Hover (containers) | `hover:border-foreground/20` |
| Active / selected | `bg-primary/10 text-primary` (menus, units, states); `bg-primary/15` for chips/badges |
| Focus (inputs) | canonical spec: `focus:border-foreground/40` + `outline-3 focus:outline-secondary/10` |
| Danger hover | `hover:bg-red-bg hover:text-red-fg` |
| Disabled | `pointer-events-none opacity-50` (buttons), `opacity-40` (icon buttons, inputs) |

### Opacity scale for subdued elements

| Opacity | Usage |
|---------|-------|
| `/5`-`/8` | Subtle backgrounds, hairline section borders (`border-foreground/8`) |
| `/10` | Hover backgrounds, `bg-primary/10` selection |
| `/15` | Input borders, chip backgrounds |
| `/20` | Modal overlay, toggle-off track |
| `/40` | Placeholder text, subtle icons, focused input borders |
| `/50`-`/60` | Tiny labels, shortcuts, muted chevrons |

### Error states

```html
<div class="border border-red-border bg-red-bg rounded-2xl p-4 text-xs text-red-fg">
  {{ errorMessage }}
</div>
```

---

## 6. Quick Reference: New Component Checklist

1. **Reuse first**: dropdown -> PopoverUi, modal -> ModalUi, icon -> IconUi (glyph in `icons.ts`), label -> LabelUi, label+control -> FieldRowUi. Raw form elements outside `components/ui/` are a review flag.
2. **Container**: `rounded-2xl border` for panels, `rounded-xl` for inner controls.
3. **Text**: `text-foreground` primary, `text-secondary` subdued, `text-[10px] font-mono uppercase tracking-wider` for labels.
4. **Hover**: `hover:border-foreground/20` containers, `hover:bg-secondary/10` clickables.
5. **State**: `defineModel()` for v-model, `withDefaults(defineProps)`, mutate stores only through actions; primitives never import stores.
6. **Dark mode**: CSS custom properties only — never hardcode hex or raw Tailwind color classes.
7. **Status colors**: semantic pairs (`bg-green-bg text-green-fg`, etc.).
8. **Animation**: `superbird-*` keyframes, spring easing `cubic-bezier(0.22, 1, 0.36, 1)`, stagger with incrementing delays.
