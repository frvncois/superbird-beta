import { useCanvasStore } from '@/stores/canvas'
import { useUserComponentsStore } from '@/stores/userComponents'
import { useToast } from '@/composables/useToast'
import { separator, type ContextMenuItem } from '@/types/contextMenu'
import { CONTAINER_TYPES } from '@/constants/canvas'
import type { CanvasNode, NodeType } from '@/types/canvas'

// Remove a node and offer an "Undo" toast that re-inserts it in place.
export function deleteNodeWithUndo(nodeId: string) {
  const store = useCanvasStore()
  const toast = useToast()
  const removed = store.removeNode(nodeId)
  if (!removed) return
  toast.success('Element deleted', {
    action: { label: 'Undo', handler: () => store.restoreNode(removed.node, removed.parentId, removed.index) },
  })
}

export type NodeMenuContext = 'canvas' | 'layers'

export interface NodeMenuCallbacks {
  onRename?: () => void
  // Opens the create-component name prompt for this node. Provided by the
  // editor root (via CreateComponentPromptKey) so the prompt is declarative.
  onCreateComponent?: () => void
}

/**
 * Context-menu actions for a canvas node. The 'layers' context adds
 * rename and move up/down; the 'canvas' context adds select-parent.
 */
export function buildNodeActions(
  node: CanvasNode,
  context: NodeMenuContext,
  callbacks?: NodeMenuCallbacks,
): ContextMenuItem[] {
  const store = useCanvasStore()
  const componentsStore = useUserComponentsStore()
  const isBody = node.type === 'body'
  const isComponent = node.type === 'component'
  const isContainer = CONTAINER_TYPES.includes(node.type)
  const hasChildren = node.children.length > 0
  const hasClasses = node.classes.length > 0
  const pos = store.getNodeIndex(node.id)
  const parentId = store.getParentId(node.id)

  return [
    {
      id: 'select-parent',
      label: 'Select Parent',
      icon: 'select-parent',
      handler: () => { if (parentId) store.selectNode(parentId) },
      hidden: context !== 'canvas' || isBody,
      disabled: !parentId,
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: 'rename',
      handler: () => callbacks?.onRename?.(),
      hidden: context !== 'layers' || isBody,
    },
    separator(),
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'duplicate',
      shortcut: '⌘D',
      handler: () => store.duplicateNode(node.id),
      hidden: isBody,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'copy',
      shortcut: '⌘C',
      handler: () => store.copyNode(node.id),
      hidden: isBody,
    },
    separator(),
    {
      id: 'paste-inside',
      label: 'Paste Inside',
      icon: 'paste',
      handler: () => store.pasteNode(node.id, 'inside'),
      hidden: !isContainer,
      disabled: !store.clipboardNode,
    },
    {
      id: 'paste-before',
      label: 'Paste Before',
      icon: 'paste',
      handler: () => store.pasteNode(node.id, 'before'),
      hidden: isBody,
      disabled: !store.clipboardNode,
    },
    {
      id: 'paste-after',
      label: 'Paste After',
      icon: 'paste',
      handler: () => store.pasteNode(node.id, 'after'),
      hidden: isBody,
      disabled: !store.clipboardNode,
    },
    separator(),
    {
      id: 'wrap',
      label: 'Wrap in Container',
      icon: 'wrap',
      handler: () => store.wrapInContainer(node.id),
      hidden: isBody,
    },
    {
      id: 'unwrap',
      label: 'Unwrap',
      icon: 'unwrap',
      handler: () => store.unwrapNode(node.id),
      hidden: isBody || !isContainer || !hasChildren,
    },
    separator(),
    {
      id: 'move-up',
      label: 'Move Up',
      icon: 'move-up',
      handler: () => store.moveUp(node.id),
      hidden: context !== 'layers' || isBody,
      disabled: !pos || pos.index === 0,
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: 'move-down',
      handler: () => store.moveDown(node.id),
      hidden: context !== 'layers' || isBody,
      disabled: !pos || pos.index >= pos.total - 1,
    },
    separator(),
    {
      id: 'copy-classes',
      label: 'Copy Classes',
      icon: 'classes',
      handler: () => store.copyClasses(node.id),
      hidden: !hasClasses,
    },
    {
      id: 'paste-classes',
      label: 'Paste Classes',
      icon: 'classes',
      handler: () => store.pasteClasses(node.id),
      disabled: store.clipboardClasses.length === 0,
    },
    separator(),
    {
      id: 'create-component',
      label: 'Create Component',
      icon: 'component',
      handler: () => callbacks?.onCreateComponent?.(),
      hidden: isBody || isComponent,
    },
    {
      id: 'detach-instance',
      label: 'Detach Instance',
      icon: 'unwrap',
      handler: () => componentsStore.detachComponentInstance(node.id),
      hidden: !isComponent,
    },
    separator(),
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      shortcut: '⌫',
      danger: true,
      handler: () => deleteNodeWithUndo(node.id),
      hidden: isBody,
    },
  ]
}

/**
 * Context-menu actions for an element in the palette (add to page / add
 * inside the current selection).
 */
export function buildElementActions(elementType: NodeType): ContextMenuItem[] {
  const store = useCanvasStore()
  const selectedNode = store.selectedNode
  const selectedIsContainer = selectedNode
    ? CONTAINER_TYPES.includes(selectedNode.type)
    : false

  return [
    {
      id: 'add-to-page',
      label: 'Add to Page',
      icon: 'add',
      handler: () => store.addNode(elementType),
    },
    {
      id: 'add-inside-selected',
      label: 'Add Inside Selected',
      icon: 'add',
      handler: () => {
        if (selectedNode) store.addNode(elementType, {}, selectedNode.id, 'inside')
      },
      hidden: !selectedNode || !selectedIsContainer,
    },
  ]
}
