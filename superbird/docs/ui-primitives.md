# UI primitives

Everything in `components/ui/`. All v-model via `defineModel()`. None import stores — design tokens arrive via prop or `GlobalTokensKey` inject. Extra classes fall through and merge (Vue class fallthrough), so `class="mb-2"` on a primitive works.

## Form controls

| Component | Model | Props | Notes |
|---|---|---|---|
| `InputUi` | `string` | `placeholder`, `size` `default`(h-12)\|`sm`(h-8, default)\|`xs`(h-7), `type`='text' | passes `type` to native input (number/url/…) |
| `TextareaUi` | `string` | `placeholder`, `rows`=3, `mono`=false | `mono` for code |
| `ToggleUi` | `boolean` | — | h-5 w-9 pill switch |
| `SegmentedControlUi` | `string` | `options: {value,label?,title?}[]`, `size` `default`\|`xs`, `grow`=false | `#option` slot `{option,active}` for custom content (e.g. icons); `grow` stretches segments |
| `ColorInputUi` | `string` | `placeholder`, `tokens?` | swatch + hex + palette popover; palette from `tokens` prop or `GlobalTokensKey` inject; emits `var(--global-<name>)` or raw hex |
| `UnitInputUi` | `string` | `placeholder`, `units`=`[px,%,em,rem,vw,vh]`, `allowAuto`=false, `tokens?` | number + unit dropdown; arrow-key stepping (`lib/unitValue`). When size tokens are available (`tokens` prop or injected `GlobalTokensKey`) it also shows a token picker + badge and emits `var(--global-size-<name>)`; token UI is inert when no tokens exist, so it doubles as a plain unit input |
| `LinkedUnitInputUi` | `[string,string,string,string]` | `labels`=`[T,R,B,L]`, `units`, `allowAuto` | linked/unlinked 4-side editor (padding/margin/radius); single input when linked, 4-up when not. Exposes `linked` + `toggleLinked()` — the parent renders the link/unlink toggle (a `bare` ButtonUi) in the group title. Usually wrapped by `LinkedFieldUi` rather than used directly |
| `LinkedFieldUi` | `[string,string,string,string]` | `title`, `labels?`, `units?`, `allowAuto?`, `linkNoun?`=`'sides'` | titled group header (label + link/unlink toggle) above a `LinkedUnitInputUi`; owns the ref plumbing so callers write one line, e.g. `<LinkedFieldUi title="Padding" v-bind="linked([…])" />`. `linkNoun` sets the toggle tooltip ("corners" for radius) |
| `UploadUi` | `string` (image URL) | `name?` (label beside thumbnail); emits `pick` | store-free image picker: thumbnail + name + clear (×) when set, dashed "Choose image" when empty. Parent wires `pick` to a chooser (e.g. `mediaStore.openPicker`) and sets `v-model`; clearing emits `''` |
| `ClassInputUi` | `activeState` (`v-model:activeState`) | `classes`, `activeClass`, `allClassNames`; emits `add`/`remove`/`select` | CSS-class chips + autocomplete + state popover |

## Buttons & icons

| Component | Props | Notes |
|---|---|---|
| `ButtonUi` | `variant` `default`\|`solid`\|`outline`\|`ghost`\|`danger`\|`bare`, `size` `default`(h-9)\|`sm`(h-7)\|`xs`(h-6), `icon?`, `align` `center`\|`start`, `square?`, `active?`, `tone` `default`\|`primary`, `to?`, `disabled?` | `default`=dark, `solid`=`bg-primary`, `danger`=red, `ghost`=transparent; **`bare`**=no box/padding/bg, hover colour only (primary when `active`) — for icon actions like the InfoCard copy/open + the linked-input link toggle. `square`=icon-only square; `active`=selected tint; `tone="primary"`=accent ghost; `to` renders `RouterLink`; `icon` = leading `IconUi`; `align="start"` left-aligns |
| `IconButtonUi` | `size` `default`(size-7)\|`sm`(size-5)\|`xs`(size-4), `variant` `default`\|`danger`, `title?`, `disabled?` | slot = an `IconUi` |
| `IconUi` | `name` (registry key), `size`=`size-3.5` (a class) | see icon list in design-tokens.md; add glyphs to `icons.ts` |

## Overlays

| Component | Model | Props | Notes |
|---|---|---|---|
| `PopoverUi` | `open` (`v-model:open`) | `align` `left`\|`right`\|`full`, `panelClass`='p-1' | anchored — put in a `relative` parent; owns backdrop + slide-fade transition. Replaces all hand-rolled dropdowns |
| `ModalUi` | `open` (`v-model:open`) | `variant` `modal`\|`dialog`, `title`, `description`, `icon`, `danger`, `position` `center`\|`right`, `size` `sm`\|`md`\|`lg`\|`xl`, `closable`, `dismissible`, `panelClass`, `bodyClass` | teleports to body; blur backdrop; `right`=full-height drawer. `dialog` variant = compact centered confirm/prompt (icon chip + `#actions` footer, red chip when `danger`); `modal` = titled panel with close (X). Slots: default (body), `#header`, `#header-action`, `#icon`, `#actions`. **This is the only modal/dialog primitive** — confirm/prompt/process flows are inline `<ModalUi variant="dialog">` driven by local `ref` state (there is no imperative dialog service) |
| `ContextMenuUi` | — | `items: ContextMenuItem[]`, `x`, `y`; emits `close` | teleported right-click menu; build items via `useNodeContextMenu` |
| `DropdownUi` | `open` (`v-model:open`) + `string` (`v-model`, select value) | `label`, `icon` (menu trigger), `items: DropdownItem[]` (`{label, icon?, danger?, separator?, handler?}`), `options: DropdownOption[]` (`{value, label, icon?, accentClass?, group?, badge?, labelStyle?, labelClass?}`), `placeholder`, `disabled`, `panelClass` | **The one dropdown + select** (replaces `SelectUi`). Self-contained trigger + panel unfolding inside a shared border; long lists scroll (`max-h`). **Menu mode**: pass `items` (handlers) / default slot. **Select mode**: pass `options` + `v-model` — the trigger shows the selection (+ its `badge`), rows use `ButtonUi active`. Rich options: `group` renders a section header when it changes, `badge` a trailing mono `BadgeUi`, `labelStyle`/`labelClass` style the label (e.g. font previews); `#footer` slot (`{close}`) adds a pinned action row (e.g. "Manage fonts"). Width via a fallthrough `class` (e.g. `class="w-full"`) — no `width` prop. Override the trigger via `#trigger`; box is `overflow-hidden` so escaping content (flyouts) must `Teleport` |
| `ToastHost` | — (queue-driven) | none | mounted **once** in `App.vue`. Bottom-right transient notifications from `useToast()`; supports an action button (e.g. Undo). Never used directly |

## Layout & feedback

| Component | Props | Notes |
|---|---|---|
| `LabelUi` | `size` `default`\|`sm`(both `text-[10px]`)\|`xs`(`text-[9px]`), `drag?`, `string` (`v-model`, only with `drag`) | mono uppercase micro-label; slot = text. With `drag`, horizontal dragging on the label scrubs the bound numeric `v-model` (shift ×10, alt ×0.1) — absorbs the old `DragLabelUi`. Tints `!text-primary` while dragging |
| `FieldRowUi` | `label`, `labelWidth` `sm`(w-12)\|`md`(w-14)\|`lg`(w-16, default), `drag?`, `string` (`v-model`, only with `drag`) | `label + control` row (side by side); slot = the control. Label is a `LabelUi` (xs); with `drag`, the label doubles as the scrub handle for the bound `v-model` (no separate drag label needed) |
| `FieldColUi` | `label`, `drag?`, `string` (`v-model`, only with `drag`) | column counterpart to `FieldRowUi`: label (`LabelUi` xs) stacked above the control (`space-y-1`); slot = the control. Same `drag`/`v-model` scrub contract. Used for the grid-packed Size/Position fields |
| `EmptyStateUi` | `message?`, `compact?` | centered empty state; slot overrides message |
| `PropertySectionUi` | `title`, `icon?` (registry key), `statesWithValues?: StyleState[]`, `defaultOpen`=true | collapsible section w/ state dots; slot = body |
| `TabsUi` | `tabs: {key,label}[]`, v-model `string` | tab bar + slide transition; one named slot per tab key |

## Where the single-consumer primitives live
`ClassInputUi`, `LinkedUnitInputUi`, `UnitInputUi` are used mainly by `sidebar/properties/*`. `PropertySectionUi` by properties/settings/global-styles. Keep them generic anyway.
