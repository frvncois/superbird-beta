# Patterns / recipes

Common moves, done the house way. Copy the shape.

## Add a label + control row (properties/settings/tabs)
```vue
<FieldRowUi label="Opacity">
  <InputUi :model-value="activeStyles.opacity ?? ''" placeholder="1"
           @update:model-value="updateStyle('opacity', $event)" />
</FieldRowUi>
```
`labelWidth` `sm|md|lg` (w-12/14/16). Grid-packed rows use `FieldColUi` (label stacked above control, `drag` scrub via `LabelUi`) — `FieldRowUi` is for a single label+control side by side.

## Edit a node's styles (in a properties section)
```ts
const { activeStyles, updateStyle, isFlex, statesWithValues } = useNodeStyles()
```
`updateStyle(key, value)` routes to the active class or instance styles automatically. Never write `node.styles[k] = …`.

## Add a node-settings edit that must be undoable
Add an action to `canvas` (never mutate `selectedNode` in a component):
```ts
// stores/canvas.ts
function setNodeSettings(id, partial) {
  const body = activePage.value.body
  const node = id === body.id ? body : findNode(body.children, id)
  if (!node) return
  Object.assign(node, partial)   // partial: Pick<CanvasNode, 'visibility'|'link'|…>
}
```
In the block: `store.setNodeSettings(node.id, { visibility: { ...(node.visibility ?? {}), ...partial } })`.

## Build a dropdown
Never hand-roll a backdrop + transition. Put `PopoverUi` in a `relative` parent:
```vue
<div class="relative">
  <button @click="open = !open">…</button>
  <PopoverUi v-model:open="open" align="right" panel-class="w-52 p-1.5 rounded-2xl">
    …items…
  </PopoverUi>
</div>
```

## Build a modal
```vue
<ModalUi v-model:open="isOpen" position="right" panel-class="w-[420px]">
  <header>…<IconButtonUi @click="close"><IconUi name="close" size="size-4" /></IconButtonUi></header>
  <TabsUi v-model="tab" :tabs="tabs"><template #site><SiteTab /></template>…</TabsUi>
</ModalUi>
```
Bind `isOpen` as a computed get/set over the store flag + action (`store.xOpen` / `store.openX()`/`closeX()`).

## Add an icon
1. Add the path to `ICON_PATHS` in `components/ui/icons.ts` (`{ d, fillRule? }[]`).
2. `<IconUi name="my-icon" size="size-4" />`. Never inline `<svg>`.

## Add a new UI primitive
- Lives in `components/ui/`, named `XxxUi.vue`. No store imports. Contextual data via prop + `inject` fallback.
- `defineModel()` for v-model; `withDefaults(defineProps<…>())`. Document it in [ui-primitives.md](ui-primitives.md).

## Create nodes / ids
`createNode(type, overrides?)` from `lib/nodeFactory`; ids from `lib/ids`. In demo data too — no bespoke factories.

## Walk the tree
`walkTree`, `findNode`, `findParent` from `lib/tree`. Return `false` from a `walkTree` visitor to prune. Don't write new recursion.

## Context menu for a node
```ts
const ctx = useContextMenu()
function onContextMenu(e) { ctx.open(e, buildNodeActions(node, 'layers')) }  // or 'canvas'
```
Render `<ContextMenuUi v-if="ctx.visible" :items="ctx.items" :x="ctx.x" :y="ctx.y" @close="ctx.close" />`.

## Interaction-preview DOM contract
Canvas nodes must keep `data-canvas-node` + `:data-node-id`; the scroll container keeps `data-canvas-scroll`. `useInteractionRunner` queries those. `.canvas-node` class is for styling only.

## The double-render rule
A sidebar panel mounts twice (expanded + collapsed float). Keep panels store-driven; no local singletons, no element `id`s, no colliding `provide`. Test both modes.
