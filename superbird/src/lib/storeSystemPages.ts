import { createNode } from '@/lib/nodeFactory'
import { generatePageId } from '@/lib/ids'
import type { CanvasNode, Page, SystemPageKey } from '@/types/canvas'

// Starter scaffolds for the store's system pages, generated on activation. The
// user restyles them freely; their `systemKey` fixes their role + public route.
// (Login-form submit + order lists get wired to customer auth in a later task.)

function heading(text: string): CanvasNode {
  return createNode('heading', { content: text })
}
function text(content: string): CanvasNode {
  return createNode('text', { content })
}
function wrap(children: CanvasNode[]): CanvasNode {
  return createNode('section', { children: [createNode('container', { children })] })
}
function link(label: string, url: string): CanvasNode {
  return createNode('link', { content: label, link: { url } })
}

function loginForm(): CanvasNode {
  return createNode('form', {
    label: 'Login form',
    children: [
      createNode('input', { props: { type: 'email', name: 'email', placeholder: 'Email' } }),
      createNode('input', { props: { type: 'password', name: 'password', placeholder: 'Password' } }),
      createNode('button', { content: 'Sign in' }),
    ],
  })
}

interface SystemPageDef {
  key: SystemPageKey
  name: string
  slug: string
  build: () => CanvasNode[]
}

export const SYSTEM_PAGE_DEFS: SystemPageDef[] = [
  { key: 'login', name: 'Login', slug: 'login', build: () => [heading('Sign in'), loginForm()] },
  { key: 'account', name: 'Account', slug: 'account', build: () => [heading('My account'), text('Your orders will appear here.'), link('Log out', '/api/store/auth/logout')] },
  { key: 'cart', name: 'Cart', slug: 'cart', build: () => [heading('Your cart'), text('Your cart is empty.')] },
  { key: 'order-confirmation', name: 'Order confirmation', slug: 'order-confirmation', build: () => [heading('Thank you!'), text('Your order has been received.')] },
]

export function buildSystemPage(def: SystemPageDef): Page {
  return {
    id: generatePageId(),
    name: def.name,
    slug: def.slug,
    pageType: 'system',
    systemKey: def.key,
    status: 'published',
    body: createNode('body', { children: [wrap(def.build())] }),
  }
}
