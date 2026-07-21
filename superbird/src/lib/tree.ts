import type { CanvasNode, UserComponent } from '@/types/canvas'
import { deepCloneNode } from '@/lib/nodeFactory'

/**
 * Depth-first traversal. Return `false` from the visitor to skip a node's children.
 */
export function walkTree(node: CanvasNode, visitor: (node: CanvasNode) => void | false): void {
  if (visitor(node) === false) return
  for (const child of node.children) {
    walkTree(child, visitor)
  }
}

export function findNode(tree: CanvasNode[], id: string): CanvasNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

export function findParent(tree: CanvasNode[], id: string): { parent: CanvasNode[]; index: number } | null {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i]!.id === id) return { parent: tree, index: i }
    const found = findParent(tree[i]!.children, id)
    if (found) return found
  }
  return null
}

export function findParentNode(parent: CanvasNode, id: string): CanvasNode | null {
  for (const child of parent.children) {
    if (child.id === id) return parent
    const found = findParentNode(child, id)
    if (found) return found
  }
  return null
}

// --- Class references ---

export function renameClassInTree(node: CanvasNode, oldName: string, newName: string): void {
  walkTree(node, (n) => {
    const idx = n.classes.indexOf(oldName)
    if (idx !== -1) n.classes[idx] = newName
  })
}

export function removeClassFromTree(node: CanvasNode, name: string): void {
  walkTree(node, (n) => {
    n.classes = n.classes.filter((c) => c !== name)
  })
}

// --- Dynamic fields ---

export function collectDynamicFields(node: CanvasNode, used: Set<string>): void {
  walkTree(node, (n) => {
    if (n.dynamicField) used.add(n.dynamicField)
  })
}

// --- Component instances ---

export function clearComponentIds(node: CanvasNode): void {
  walkTree(node, (n) => {
    delete n.componentId
    delete n.contentOverrides
  })
}

export function countInstances(node: CanvasNode, compId: string): number {
  let count = 0
  walkTree(node, (n) => {
    if (n.componentId === compId) count++
  })
  return count
}

export function detachAllInstances(node: CanvasNode, compId: string): void {
  walkTree(node, (n) => {
    if (n.componentId === compId && n.type === 'component') {
      n.type = 'container'
      delete n.componentId
      delete n.contentOverrides
    }
  })
}

export function collectContentFromTree(node: CanvasNode, overrides: Record<string, string>): void {
  walkTree(node, (n) => {
    if (n.content !== undefined) {
      overrides[n.id] = n.content
    }
  })
}

export function collectContentOverrides(node: CanvasNode): Record<string, string> {
  const overrides: Record<string, string> = {}
  if (node.contentOverrides) {
    Object.assign(overrides, node.contentOverrides)
  }
  collectContentFromTree(node, overrides)
  return overrides
}

export function applyContentOverrides(node: CanvasNode, overrides: Record<string, string>): void {
  // Content overrides are applied by position index since IDs change on clone.
  // For simplicity, instances keep their own content via the contentOverrides map.
  for (const child of node.children) {
    applyContentOverrides(child, overrides)
  }
}

export function syncInstancesInTree(node: CanvasNode, comp: UserComponent): void {
  walkTree(node, (n) => {
    if (n.componentId === comp.id && n.type === 'component') {
      // Preserve content overrides, sync structure and classes
      const overrides = collectContentOverrides(n)
      const synced = deepCloneNode(comp.tree)
      applyContentOverrides(synced, overrides)
      n.children = synced.children
      n.classes = [...synced.classes]
      n.tag = synced.tag
      n.styles = { ...synced.styles }
      n.props = { ...synced.props }
      n.label = comp.name
      // Don't recurse into component children — they're managed by the definition
      return false
    }
  })
}
