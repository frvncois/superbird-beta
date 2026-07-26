import { createNode } from '@/lib/nodeFactory'
import type { CanvasNode, PrebuiltElementKey } from '@/types/canvas'

// Prebuilt "Dynamic" elements: ready-made trees the user can restyle/rearrange,
// while the runtime wires a fixed action via the root's data-sb-el.

export interface PrebuiltDef {
  key: PrebuiltElementKey
  label: string
  icon: string
  build: () => CanvasNode
}

function langSwitcherTree(): CanvasNode {
  // Placeholder links for the editor; the published site regenerates them from
  // the site's actual locales.
  return createNode('div', {
    tag: 'nav',
    label: 'Language switcher',
    element: 'lang-switcher',
    children: [
      createNode('link', { content: 'EN', link: { url: '?lang=en' } }),
      createNode('link', { content: 'FR', link: { url: '?lang=fr' } }),
    ],
  })
}

export const PREBUILT_ELEMENTS: PrebuiltDef[] = [
  { key: 'lang-switcher', label: 'Lang', icon: 'globe', build: langSwitcherTree },
]

export function buildPrebuilt(key: PrebuiltElementKey): CanvasNode | null {
  return PREBUILT_ELEMENTS.find((p) => p.key === key)?.build() ?? null
}
