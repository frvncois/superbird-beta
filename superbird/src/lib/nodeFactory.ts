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

export function deepCloneNode(node: CanvasNode): CanvasNode {
  return createNode(node.type, {
    tag: node.tag,
    label: node.label,
    content: node.content,
    classes: [...node.classes],
    children: node.children.map(deepCloneNode),
    styles: { ...node.styles },
    props: { ...node.props },
  })
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
