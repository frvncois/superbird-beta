# Superbird Design System

Complete reference for replicating the Superbird visual style across the app.

---

## 1. Foundations

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `'Geist', sans-serif` | All body text, headings, buttons |
| `--font-mono` | `'Geist Mono', monospace` | Badges, labels, small metadata, slider values, toggle labels |

Font loaded from Google Fonts: `Geist:wght@100..900` + `Geist Mono:wght@100..900`.

**Type scale (Tailwind classes):**

| Context | Class | Weight | Example |
|---------|-------|--------|---------|
| Hero heading | `text-5xl font-medium` | 500 | "Your web toolkit" |
| Page title | `text-2xl font-semibold leading-none` | 600 | SharedIntro `h1` |
| Section/card title | `font-medium text-foreground` or `font-semibold` | 500-600 | UiCard `h2`, UiModal `h2` |
| List header | `text-xs font-medium` | 500 | UiList header |
| Body text | `text-sm text-secondary` | 400 | Descriptions, paragraphs |
| Small label | `text-[10px] font-mono uppercase tracking-wider` | -- | Badges, toggles, vital keys |
| Tiny label | `text-[9px] font-mono uppercase` | -- | Status pills inside vitals |

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
| `--color-primary` | `#6366f1` | Indigo accent (button default bg) |
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

Dark mode is class-based only (no `prefers-color-scheme`), toggled by `useTheme` composable. Default is light.

#### Semantic color pairs (bg + fg)

Each semantic color defines a background and foreground pair. Used in badges, status indicators, method selectors, and alerts.

| Name | Background | Foreground | Usage |
|------|-----------|------------|-------|
| Green | `#dcfce7` | `#29c965` | Pass, success, good status |
| Blue | `#dbeafe` | `#1d4ed8` | Info, POST method, web-ready |
| Purple | `#f3e8ff` | `#7e22ce` | PATCH method, purple badges |
| Amber | `#fef3c7` | `#b45309` | Warnings, PUT method |
| Red (bg/border/fg) | `#fef2f2` / `#fecaca` / `#b91c1c` | -- | Errors, DELETE, fail status |
| Red strong | -- | `#ef4444` | Score indicator |
| Orange | `#ffedd5` | `#c2410c` | Getting-big range, orange badges |
| Yellow | `#fef9c3` | `#a16207` | Small range, yellow badges |
| Muted | `#f3f4f6` | `#8d939e` | Default/neutral state, N/A, light badges |

#### Score colors (audit)

| Token | Hex | Meaning |
|-------|-----|---------|
| `--score-green` | `#22c55e` | Good (90-100) |
| `--score-amber` | `#f59e0b` | Needs work (50-89) |
| `--score-red` | `#ef4444` | Poor (0-49) |

### Spacing & Layout

**App shell:** `max-w-3xl m-auto px-6` -- centered, narrow, with horizontal padding.

**Page structure:**
```
<main class="max-w-3xl m-auto space-y-8 px-6">
  <SharedHeader />    <- py-8
  <RouterView />      <- space-y-8 between sections
  <SharedFooter />    <- mt-25, border-t, py-6
</main>
```

**Common spacing patterns:**
- Between page sections: `space-y-8` (2rem)
- Between content blocks: `space-y-3` (0.75rem)
- Card grid gap: `gap-3` (0.75rem)
- Badge groups: `gap-1.5` (0.375rem)
- Intro section bottom: `pb-12` (3rem)
- Hero bottom: `pb-18` (4.5rem)
- Footer top margin: `mt-25` (6.25rem)

### Border Radius

| Context | Radius | Usage |
|---------|--------|-------|
| Cards, modals, dropdowns, upload zone | `rounded-2xl` | Primary container shape |
| Buttons (default), inputs (default), tabs | `rounded-2xl` | Large interactive elements |
| Buttons (md/sm), select pills, icon default | `rounded-xl` | Medium interactive elements |
| Buttons (xs), badges, tooltips | `rounded-lg` | Small elements |
| Toggle knob, icon circle variant | `rounded-full` | Circular elements |

The design strongly favors `rounded-2xl` for any container and `rounded-xl` for inner interactive elements.

### Borders

All elements inherit `border-color: var(--color-border)` from the base reset. Borders are subtle -- `1px solid` using the theme border color.

**Hover pattern:** `hover:border-foreground/20` -- borders slightly darken on hover.

---

## 2. Components

### UiButton

Four sizes, three variants. Default renders as indigo (`#6366f1`) filled button.

| Size | Classes |
|------|---------|
| `default` | `h-12 px-6 text-sm rounded-2xl` |
| `md` | `h-9 px-4 text-sm rounded-xl` |
| `sm` | `h-7 px-3 text-xs rounded-xl` |
| `xs` | `h-6 px-2 text-[10px] rounded-lg` |

| Variant | Style |
|---------|-------|
| `default` | `bg-foreground text-background`, hover: `bg-foreground/85` |
| `outline` | `bg-transparent border text-foreground`, hover: `bg-secondary/10` |
| `ghost` | `bg-transparent text-foreground`, hover: `bg-secondary/10` |

Active state (when button's `to` matches route): inverts to `bg-foreground text-background` for ghost, adds `bg-foreground/10 border-foreground/30` for outline.

All buttons: `inline-flex items-center justify-center font-medium cursor-pointer gap-1.5`.
Disabled: `pointer-events-none opacity-50`.
Transitions: `background-color, color, border-color, opacity` at `0.25s ease`.

Can render as `<button>` or `<RouterLink>` via the `to` prop.

### UiBadge

Small pill with a dot prefix.

```
inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
text-[10px] font-mono uppercase tracking-wider
```

The dot: `size-1.5 rounded-full bg-current opacity-50`.

Colors map directly to the semantic color pairs (e.g., `color="green"` -> `bg-green-bg text-green-fg`). Special values: `dark` = `bg-foreground text-background`, `light` (default) = `bg-muted-bg text-muted-fg`.

### UiInput

Two variants, two sizes.

| Variant | Style |
|---------|-------|
| `default` | Border input with focus ring: `border border-foreground/15 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10` |
| `lookup` | Borderless, used inside UiLookup: `border-none outline-none` |

| Size | Classes |
|------|---------|
| `default` | `h-12 px-3 text-sm rounded-2xl` |
| `sm` | `h-8 px-2.5 text-xs` |

Always: `w-full bg-transparent text-foreground placeholder:text-foreground/40`.

### UiLookup

Combined search bar = input + action button inside a bordered container.

```
flex items-center gap-1.5 border rounded-2xl p-1.5
outline-3 outline-transparent focus-within:outline-secondary/10
```

Contains: `<UiInput variant="lookup">` + `<UiButton size="md">`.
Button icon and label support animated transitions (cross-fade for icon, slide-up for text).
Optional history dropdown: `rounded-2xl border bg-background p-1 shadow-lg`.

### UiCard

RouterLink card for tool grid. Bordered container with hover arrow effect.

```
flex flex-col gap-6 rounded-2xl border border-border/75 p-6
hover:border-foreground/20 transition-colors
```

Arrow icon: `absolute top-6 right-6 size-3 text-foreground/40`, on hover moves diagonally up-right.

Contains: UiIcon + title (`font-medium`) + description (`text-sm text-secondary`) + optional badge row.

### UiList

Bordered card with a structured header and content slot.

**Container:** `border rounded-2xl overflow-hidden`

**Header area:** `flex items-start gap-3 bg-secondary/5 px-3 py-3 border-b`
- Icon: `size-3.5`
- Title: `text-xs font-medium`
- Description: `text-[10px] text-secondary/75`
- Optional count badge and action slot

Supports staggered entrance via `animationDelay` prop using `superbird-fade-in-up`.

### UiIcon

Icon container with background. Used for tool cards, upload zone, hero.

| Size + Variant | Classes |
|----------------|---------|
| `default` + `default` | `size-8 p-2 rounded-xl` |
| `large` + `default` | `size-14 p-4 rounded-2xl` |
| `default` + `circle` | `size-16 p-4 rounded-full` |
| `large` + `circle` | `size-18 p-6 rounded-full` |

Always: `bg-icon-bg text-icon-txt` (black bg, white text in light mode).

Icons sourced from `@heroicons/vue` -- supports outline (24), solid (24), and mini (20) styles via the `style` prop.

### UiModal

Centered dialog teleported to `<body>`.

**Overlay:** `bg-foreground/20 backdrop-blur-sm` -- click to close.
**Card:** `max-w-sm rounded-2xl border bg-background p-6 shadow-lg`.
**Header:** `font-semibold text-foreground` + close button (`size-4` X icon, `text-secondary hover:text-foreground`).

Enter/leave: opacity + scale (95% -> 100%).

### UiAlert

Centered dialog variant with icon, title, description, and dismiss button.

**Icon container:** `size-12 rounded-2xl bg-amber-bg text-amber-fg` with `size-6` icon.
**Title:** `font-semibold text-foreground`.
**Description:** `text-sm text-secondary leading-relaxed`.
**Button:** Full-width `h-9 px-4 rounded-xl bg-foreground text-background text-sm font-medium`.

### UiTabs

Tab bar with directional slide-fade content transitions.

**Tab button:** `text-sm pb-3 px-1 mr-4 border-b-2 -mb-px`
- Active: `border-foreground text-foreground font-medium`
- Inactive: `border-transparent text-secondary hover:text-foreground`

Content slides left/right based on tab direction. Duration: 250ms enter, 200ms leave.

### UiSelect (Segmented Control)

Pill-shaped segmented selector with a sliding background indicator.

**Container:** `rounded-xl bg-foreground/5 p-1`
**Active indicator:** `rounded-lg bg-background shadow` -- animates position with `transition-all duration-200`.
**Button:** `flex-1 py-1.5 text-sm rounded-lg`
- Selected: `text-foreground font-medium`
- Unselected: `text-secondary`

### UiToggle

Switch component with label.

**Label:** `text-[10px] font-mono uppercase text-foreground`
**Track:** `h-5 w-9 rounded-full`, on: `bg-foreground`, off: `bg-foreground/20`
**Thumb:** `size-4 rounded-full bg-background shadow`, translates `x-4` when on.

### UiDropdown

Button trigger + teleported dropdown panel.

**Trigger:** `h-8 px-3 rounded-xl border text-foreground hover:bg-secondary/10`
- Icon: `size-4 text-secondary`
- Label: `text-[10px] font-mono uppercase`
- Chevron: `size-3.5 text-secondary`, rotates 180deg when open

**Panel:** `fixed rounded-2xl border bg-background p-3 shadow-lg/3`

### UiMethodSelect

HTTP method selector -- color-coded badges as trigger + dropdown.

**Trigger:** `h-9 px-4 rounded-xl text-[10px] font-mono font-semibold`
Colors per method: GET=green, POST=blue, PUT=amber, PATCH=purple, DELETE=red.

**Dropdown items:** Same color scheme, selected has `ring-2 ring-offset-1 ring-current`.

### UiTooltip

Small tooltip teleported to body, positioned above trigger.

```
px-2 py-1 bg-foreground text-background text-[10px] rounded-lg whitespace-nowrap
```

### UiSkeleton

Loading placeholder with progressive blur fade-out at the bottom.

**Container:** `h-[40em] overflow-hidden`
**Pulse:** `animation: superbird-skeleton-pulse 1.8s ease-in-out infinite` (when loading)
**Blur layers:** 3 stacked `backdrop-filter: blur()` layers with mask gradients + a solid gradient overlay using `var(--color-background)`.

### UiSlider

Range input with current value display and semantic badge.

**Value:** `text-sm font-mono text-foreground`
**Track fill:** Linear gradient from `var(--color-foreground)` to `var(--color-border)`.
**Thumb:** `size-4 rounded-full bg-foreground`.
**Range labels:** `text-xs text-secondary font-mono`.

### UiUpload

Drag-and-drop file upload zone.

**Drop zone:** `border rounded-2xl` with `hover:border-foreground/20`, active drag: `border-foreground/40 bg-foreground/5`.
**Icon:** UiIcon `variant="circle" size="large"`, scales on hover (`group-hover:scale-110`).
**Label:** `text-sm font-medium text-secondary`.
**Format badges:** Row of UiBadge (default light color).

### UiContent

Simple prose wrapper: `space-y-6 text-sm leading-relaxed text-secondary`.

### UiPanel

Basic bordered panel: `rounded-lg border border-border p-4`, optional `shadow-md` when elevated.

---

## 3. Shared Layout Components

### SharedHeader

`<header class="flex justify-between py-8">`

- Logo + brand name on the left (animated reveal on home page)
- Nav buttons on the right: `UiButton variant="ghost" size="sm"` per route
- Nav gap: `gap-1.5`

### SharedIntro

Page intro block used on every tool page.

```
<section>
  <div class="flex flex-col gap-3 pb-12">
    <h1 class="text-2xl font-semibold leading-none">{{ title }}</h1>
    <p class="text-sm max-w-[50ch] text-secondary">{{ description }}</p>
  </div>
</section>
```

Both elements have staggered intro/exit animations.

### SharedFooter

```
<footer class="mt-25">
  <div class="flex flex-col items-center sm:flex-row sm:justify-between gap-2
              border-t py-6 text-[10px] text-secondary/50 font-mono uppercase tracking-wider">
```

Links use `hover:text-secondary transition-colors duration-[250ms]`.

---

## 4. Animation System

### Keyframes

| Name | From | To | Usage |
|------|------|----|-------|
| `superbird-intro-enter` | `opacity:0; translateY(0.25em)` | `opacity:1; translateY(0)` | Text/content entrance |
| `superbird-intro-exit` | `opacity:1; translateY(0)` | `opacity:0; translateY(-0.25em)` | Text/content exit |
| `superbird-hero-icon-enter` | `translateX(-200%) translateY(-120%) rotate(90deg)` | normal | Hero icon fly-in |
| `superbird-hero-icon-exit` | normal | `translateX(200%) translateY(-120%) rotate(-50deg)` | Hero icon fly-out |
| `superbird-fade-in` | `opacity:0` | `opacity:1` | Generic fade in |
| `superbird-fade-out` | `opacity:1` | `opacity:0` | Generic fade out |
| `superbird-fade-in-up` | `opacity:0; translateY(10px)` | `opacity:1; translateY(0)` | Staggered list entrance |
| `superbird-skeleton-pulse` | `opacity:0.5` -> `0.9` -> `0.5` | -- | Skeleton loading |
| `superbird-modal-in` | `opacity:0; translateY(-10px) scale(0.97)` | `opacity:1; translateY(0) scale(1)` | Modal entrance |

### Easing

| Context | Easing |
|---------|--------|
| Entrance (spring-like) | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Exit (accelerate out) | `cubic-bezier(0.4, 0, 1, 1)` |
| Generic / hover / focus | `ease` |
| Segmented control slide | `ease-in-out` |

### Durations

| Context | Duration |
|---------|----------|
| Entrance animations | 400-600ms |
| Exit animations | 250-300ms (must stay under 400ms route block) |
| Hover/focus transitions | 150-250ms |
| Tab slide-fade | 200-250ms |
| Dropdown show/hide | 100-150ms |

### Staggered entrance pattern

Elements receive incrementing delays via inline `:style` bindings:

```ts
// HomeTools card delays
const delays = [250, 300, 350, 400]

// HomeHero badge delays
const badgeStyles = [520, 600, 680, 760].map(delay => ({
  animation: `superbird-intro-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`
}))

// UiList staggered entrance
:style="`animation: superbird-fade-in-up 0.5s ease both; animation-delay: ${animationDelay}ms`"
```

### Route leave system

`useRouteLeave()` blocks navigation for 400ms. Components check the `leaving` ref to swap between enter/exit animations. Pattern:

```ts
const leaving = useRouteLeave()
const style = computed(() => ({
  animation: leaving.value
    ? 'superbird-fade-out 0.25s ease both'
    : 'superbird-fade-in 0.4s ease both',
}))
```

### Vue Transition patterns

**Dropdowns/panels (slide-fade):**
```
enter: opacity-0 translate-y-1 -> opacity-100 translate-y-0 (150ms)
leave: reverse (100ms)
```

**Modals (scale-fade):**
```
enter: opacity-0 scale-95 -> opacity-100 scale-100 (200ms)
leave: reverse (150ms)
```

**Tab content (directional slide):**
```
enter-from: opacity-0 translate-x-3 (or -3)
enter-to: opacity-100 translate-x-0 (250ms ease-out)
leave: reverse direction (200ms ease-in)
```

---

## 5. Patterns & Conventions

### Interaction states

| State | Pattern |
|-------|---------|
| Hover (buttons) | `bg-secondary/10` (ghost/outline), `bg-foreground/85` (default) |
| Hover (cards/borders) | `border-foreground/20` |
| Active (press) | `bg-secondary/20` |
| Focus visible | `outline-2 outline-offset-2 outline-foreground` (or `outline-black` for variants) |
| Focus within (inputs) | `outline-secondary/10` (3px), `border-foreground/40` |
| Disabled | `pointer-events-none opacity-50` |

### Opacity scale for subdued elements

| Opacity | Usage |
|---------|-------|
| `/5` | Subtle backgrounds (`bg-secondary/5` for list headers) |
| `/8`-`/10` | Hover backgrounds |
| `/15` | Input borders, active press backgrounds |
| `/20` | Overlay backgrounds, secondary hover borders |
| `/40` | Placeholder text, subtle icons, input focus borders |
| `/50` | Footer text, badge dots, disabled |
| `/75` | List descriptions, small metadata |

### Error states

```html
<div class="border border-red-border bg-red-bg rounded-2xl p-4 text-xs text-red-fg">
  {{ errorMessage }}
</div>
```

### Grid layouts

- Tool cards grid (home): `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Home page: `grid grid-cols-1 lg:grid-cols-2 gap-8`
- Vitals grid: `grid grid-cols-2 gap-2 md:grid-cols-3`

### Icon conventions

All icons from `@heroicons/vue`. Default style is `24/outline`. Standard sizes:

| Context | Size |
|---------|------|
| Button/nav icon | `size-4` |
| List header icon | `size-3.5` |
| Card arrow | `size-3` |
| Dropdown chevron | `size-3.5` |
| Badge dot | `size-1.5` |
| Alert dialog icon | `size-6` (in `size-12` container) |

### Transition timing

All hover/focus transitions use `transition-colors` with `duration-[250ms]` or the default Tailwind duration. Some components also transition `border-color`, `outline-color`, and `opacity`.

---

## 6. Quick Reference: New Component Checklist

When building a new component in Superbird style:

1. **Container:** `rounded-2xl border` for cards/panels, `rounded-xl` for inner controls
2. **Text:** `text-foreground` for primary, `text-secondary` for descriptions, `font-mono uppercase text-[10px]` for labels
3. **Spacing:** `p-3` to `p-6` for containers, `gap-1.5` to `gap-3` for flex layouts
4. **Hover:** `hover:border-foreground/20` for containers, `hover:bg-secondary/10` for clickable elements
5. **Animation:** Use `superbird-fade-in-up` for entrance, `superbird-fade-out` for exit, stagger with increasing delay values
6. **Route leave:** Wire up `useRouteLeave()` and swap animation based on `leaving` ref
7. **Dark mode:** Use CSS custom properties (not hardcoded colors) so dark mode works automatically
8. **Icons:** Use Heroicons outline 24px, wrap in `UiIcon` when a background container is needed
9. **Status colors:** Map to semantic pairs (green/blue/amber/red/muted) -- never use raw Tailwind color classes
