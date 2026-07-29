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
      n.type = 'div'
      delete n.componentId
      delete n.contentOverrides
    }
  })
}

// Per-instance content is keyed by structural path — the child-index path from
// the instance root (e.g. "0.2.1") — not by node id: ids are regenerated on
// every clone, so they can't line an existing instance up against a freshly
// cloned definition tree. Same structure ⇒ same paths ⇒ overrides survive sync.
function contentByPath(nodes: CanvasNode[], prefix: string, out: Record<string, string>): void {
  nodes.forEach((n, i) => {
    const path = prefix ? `${prefix}.${i}` : String(i)
    if (n.content !== undefined) out[path] = n.content
    contentByPath(n.children, path, out)
  })
}

export function collectContentOverrides(node: CanvasNode): Record<string, string> {
  const overrides: Record<string, string> = {}
  contentByPath(node.children, '', overrides)
  return overrides
}

export function applyContentOverrides(node: CanvasNode, overrides: Record<string, string>): void {
  const apply = (nodes: CanvasNode[], prefix: string): void => {
    nodes.forEach((n, i) => {
      const path = prefix ? `${prefix}.${i}` : String(i)
      // Only restore where the (possibly re-structured) definition still has a
      // content slot at this path; overrides for removed slots are dropped.
      const val = overrides[path]
      if (n.content !== undefined && val !== undefined) n.content = val
      apply(n.children, path)
    })
  }
  apply(node.children, '')
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
