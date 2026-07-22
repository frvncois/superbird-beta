import type { Breakpoint, CanvasNode, NodeType, Page, PageType, StateStyles } from '@/types/canvas'
import { nodeDefaults } from '@/constants/canvas'
import { generateNodeId, generatePageId } from '@/lib/ids'

function createStateStyles(): StateStyles {
  return { default: {}, hover: {}, focus: {}, active: {}, visited: {} }
}

export function createStyleClassStyles(): Record<Breakpoint, StateStyles> {
  return {
    desktop: createStateStyles(),
    tablet: createStateStyles(),
    mobile: createStateStyles(),
  }
}

export function createNode(
  type: NodeType,
  overrides: Partial<Omit<CanvasNode, 'id' | 'type'>> = {},
): CanvasNode {
  const defaults = nodeDefaults[type] ?? {}
  return {
    ...overrides,
    id: generateNodeId(),
    type,
    tag: overrides.tag ?? defaults.tag ?? 'div',
    label: overrides.label ?? defaults.label ?? type,
    content: overrides.content ?? defaults.content,
    classes: overrides.classes ?? [],
    children: overrides.children ?? [],
    styles: overrides.styles ?? {},
    props: overrides.props ?? {},
  }
}

// Deep-clone a node with fresh ids. Copies EVERY field (interactions, link,
// visibility, accessibility, advanced, customAttributes, dynamicField,
// contentOverrides, …) — not just the presentational subset — so duplicate,
// copy/paste and "save as component" don't silently drop behavior. `htmlId` is
// dropped on purpose: a user-set DOM id must stay unique, so copies don't carry it.
export function deepCloneNode(node: CanvasNode): CanvasNode {
  const clone = JSON.parse(JSON.stringify({ ...node, children: [] })) as CanvasNode
  clone.id = generateNodeId()
  delete clone.htmlId
  clone.children = node.children.map(deepCloneNode)
  return clone
}

export function createPage(name: string, slug?: string, pageType: PageType = 'page'): Page {
  return {
    id: generatePageId(),
    name,
    slug: slug ?? name.toLowerCase().replace(/\s+/g, '-'),
    pageType,
    body: createNode('body'),
  }
}
