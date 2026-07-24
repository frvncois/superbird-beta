import { createNode } from '@/lib/nodeFactory'
import type { CanvasNode, PrebuiltElementKey } from '@/types/canvas'

// Prebuilt "Dynamic" elements: ready-made trees the user can restyle/rearrange,
// while the runtime wires a fixed action (login/cart) via the root's data-sb-el.

export interface PrebuiltDef {
  key: PrebuiltElementKey
  label: string
  icon: string
  build: () => CanvasNode
}

function loginTree(): CanvasNode {
  return createNode('form', {
    label: 'Login',
    element: 'login',
    children: [
      createNode('input', { props: { type: 'email', name: 'email', placeholder: 'Email' } }),
      createNode('input', { props: { type: 'password', name: 'password', placeholder: 'Password' } }),
      createNode('button', { content: 'Sign in' }),
    ],
  })
}

function cartTree(): CanvasNode {
  // The runtime fills this with the live cart; the placeholder is replaced.
  return createNode('div', {
    label: 'Cart',
    element: 'cart',
    children: [
      createNode('heading', { tag: 'h3', content: 'Your cart' }),
      createNode('text', { content: 'Your cart is empty.' }),
    ],
  })
}

function addToCartTree(): CanvasNode {
  // A single button; the runtime's delegated click handler adds the current
  // product (resolved from data-sb-add-to-cart / the nearest [data-sb-entry])
  // to the cart. Restyleable like any button.
  return createNode('button', {
    label: 'Add to cart',
    element: 'add-to-cart',
    content: 'Add to cart',
  })
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
  { key: 'login', label: 'Login', icon: 'users', build: loginTree },
  { key: 'cart', label: 'Cart', icon: 'cart', build: cartTree },
  { key: 'add-to-cart', label: 'Add to cart', icon: 'cart', build: addToCartTree },
]

export function buildPrebuilt(key: PrebuiltElementKey): CanvasNode | null {
  return PREBUILT_ELEMENTS.find((p) => p.key === key)?.build() ?? null
}
