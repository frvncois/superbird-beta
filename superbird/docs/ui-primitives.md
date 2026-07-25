# UI primitives

Everything in `components/ui/`. All v-model via `defineModel()`. None import stores — design tokens arrive via prop or `GlobalTokensKey` inject. Extra classes fall through and merge (Vue class fallthrough), so `class="mb-2"` on a primitive works.

## Form controls

| Component | Model | Props | Notes |
|---|---|---|---|
| `InputUi` | `string` | `placeholder`, `size` `default`(h-12)\|`sm`(h-8, default)\|`xs`(h-7), `type`='text' | passes `type` to native input (number/url/…) |
| `TextareaUi` | `string` | `placeholder`, `rows`=3, `mono`=false | `mono` for code |
| `SelectUi` | `string` | `options: {value,label}[]` | native select, styled |
| `ToggleUi` | `boolean` | — | h-5 w-9 pill switch |
| `SegmentedControlUi` | `string` | `options: {value,label?,title?}[]`, `size` `default`\|`xs`, `grow`=false | `#option` slot `{option,active}` for custom content (e.g. icons); `grow` stretches segments |
| `ColorInputUi` | `string` | `placeholder`, `tokens?` | swatch + hex + palette popover; palette from `tokens` prop or `GlobalTokensKey` inject; emits `var(--global-<name>)` or raw hex |
| `UnitInputUi` | `string` | `placeholder`, `units`=`[px,%,em,rem,vw,vh]`, `allowAuto`=false | number + unit dropdown; arrow-key stepping (`lib/unitValue`) |
| `SizeTokenInputUi` | `string` | `placeholder`, `units`, `allowAuto`, `tokens?` | UnitInput + size-token badges; tokens via prop/inject; emits `var(--global-size-<name>)` |
| `LinkedUnitInputUi` | `[string,string,string,string]` | `labels`=`[T,R,B,L]`, `units`, `allowAuto` | linked/unlinked 4-side editor (padding/margin/radius) |
| `DragLabelUi` | `string` | `sensitivity` | draggable label that scrubs a numeric value; slot = label text |
| `ClassInputUi` | `activeState` (`v-model:activeState`) | `classes`, `activeClass`, `allClassNames`; emits `add`/`remove`/`select` | CSS-class chips + autocomplete + state popover |

## Buttons & icons

| Component | Props | Notes |
|---|---|---|
| `ButtonUi` | `variant` `default`\|`solid`\|`outline`\|`ghost`\|`danger`, `size` `default`(h-9)\|`sm`(h-7), `icon?`, `align` `center`\|`start`, `to?`, `disabled?` | `default`=dark (`bg-foreground text-background`), `solid`=`bg-primary`, `danger`=red; `to` renders `RouterLink`; `icon` renders a leading `IconUi`; `align="start"` left-aligns content (full-width menu rows) |
| `IconButtonUi` | `size` `default`(size-7)\|`sm`(size-5)\|`xs`(size-4), `variant` `default`\|`danger`, `title?`, `disabled?` | slot = an `IconUi` |
| `IconUi` | `name` (registry key), `size`=`size-3.5` (a class) | see icon list in design-tokens.md; add glyphs to `icons.ts` |

## Overlays

| Component | Model | Props | Notes |
|---|---|---|---|
| `PopoverUi` | `open` (`v-model:open`) | `align` `left`\|`right`\|`full`, `panelClass`='p-1' | anchored — put in a `relative` parent; owns backdrop + slide-fade transition. Replaces all hand-rolled dropdowns |
| `ModalUi` | `open` (`v-model:open`) | `variant` `modal`\|`dialog`, `title`, `description`, `icon`, `danger`, `position` `center`\|`right`, `size` `sm`\|`md`\|`lg`\|`xl`, `closable`, `dismissible`, `panelClass`, `bodyClass` | teleports to body; blur backdrop; `right`=full-height drawer. `dialog` variant = compact centered confirm/prompt (icon chip + `#actions` footer, red chip when `danger`); `modal` = titled panel with close (X). Slots: default (body), `#header`, `#header-action`, `#icon`, `#actions`. **This is the only modal/dialog primitive** — confirm/prompt/process flows are inline `<ModalUi variant="dialog">` driven by local `ref` state (there is no imperative dialog service) |
| `ContextMenuUi` | — | `items: ContextMenuItem[]`, `x`, `y`; emits `close` | teleported right-click menu; build items via `useNodeContextMenu` |
| `DropdownUi` | `open` (`v-model:open`) | `label`, `icon` (built-in trigger), `items: DropdownItem[]` (`{label, icon?, danger?, separator?, handler?}`), `width` (Tailwind width utility, default `w-49`), `panelClass` | self-contained trigger + unfolding panel (trigger + panel share one border, so both use `width`). Renders `items` as `ButtonUi` rows; closes itself after a handler. Override the trigger via `#trigger` and add richer content via the default slot (`{ close }`). The box is `overflow-hidden` — content that must escape (submenu flyouts) has to `Teleport` out |
| `ToastHost` | — (queue-driven) | none | mounted **once** in `App.vue`. Bottom-right transient notifications from `useToast()`; supports an action button (e.g. Undo). Never used directly |

## Layout & feedback

| Component | Props | Notes |
|---|---|---|
| `LabelUi` | `size` `default`\|`xs` | mono uppercase micro-label; slot = text |
| `FieldRowUi` | `label`, `labelWidth` `sm`(w-12)\|`md`(w-14)\|`lg`(w-16, default) | `label + control` row; slot = the control |
| `EmptyStateUi` | `message?`, `compact?` | centered empty state; slot overrides message |
| `PropertySectionUi` | `title`, `icon?` (registry key), `statesWithValues?: StyleState[]`, `defaultOpen`=true | collapsible section w/ state dots; slot = body |
| `TabsUi` | `tabs: {key,label}[]`, v-model `string` | tab bar + slide transition; one named slot per tab key |

## Where the single-consumer primitives live
`ClassInputUi`, `LinkedUnitInputUi`, `DragLabelUi`, `SizeTokenInputUi` are used mainly by `sidebar/properties/*`. `PropertySectionUi` by properties/settings/global-styles. Keep them generic anyway.
