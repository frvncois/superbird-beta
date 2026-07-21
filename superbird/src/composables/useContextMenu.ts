import { ref, type Ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { separator, filterMenuItems, type ContextMenuItem } from '@/types/contextMenu'
import { CONTAINER_TYPES, type CanvasNode, type NodeType } from '@/types/canvas'

export function useContextMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const items: Ref<ContextMenuItem[]> = ref([])

  function open(event: MouseEvent, menuItems: ContextMenuItem[]) {
    event.preventDefault()
    event.stopPropagation()
    x.value = event.clientX
    y.value = event.clientY
    items.value = filterMenuItems(menuItems)
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, x, y, items, open, close }
}

export function buildLayerActions(node: CanvasNode, callbacks?: { onRename?: () => void; onCreateComponent?: () => void }): ContextMenuItem[] {
  const store = useCanvasStore()
  const isBody = node.type === 'body'
  const isComponent = node.type === 'component'
  const isContainer = CONTAINER_TYPES.includes(node.type)
  const hasChildren = node.children.length > 0
  const pos = store.getNodeIndex(node.id)
  const hasClasses = node.classes.length > 0

  return [
    {
      id: 'rename',
      label: 'Rename',
      icon: 'rename',
      handler: () => callbacks?.onRename?.(),
      hidden: isBody,
    },
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
      hidden: isBody,
      disabled: !pos || pos.index === 0,
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: 'move-down',
      handler: () => store.moveDown(node.id),
      hidden: isBody,
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
      handler: () => store.detachComponentInstance(node.id),
      hidden: !isComponent,
    },
    separator(),
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      shortcut: '⌫',
      danger: true,
      handler: () => store.removeNode(node.id),
      hidden: isBody,
    },
  ]
}

export function buildCanvasActions(node: CanvasNode): ContextMenuItem[] {
  const store = useCanvasStore()
  const isBody = node.type === 'body'
  const isComponent = node.type === 'component'
  const isContainer = CONTAINER_TYPES.includes(node.type)
  const hasChildren = node.children.length > 0
  const hasClasses = node.classes.length > 0
  const parentId = store.getParentId(node.id)

  return [
    {
      id: 'select-parent',
      label: 'Select Parent',
      icon: 'select-parent',
      handler: () => { if (parentId) store.selectNode(parentId) },
      hidden: isBody,
      disabled: !parentId,
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
      handler: () => {
        const name = prompt('Component name:')
        if (name) store.createComponentFromNode(node.id, name)
      },
      hidden: isBody || isComponent,
    },
    {
      id: 'detach-instance',
      label: 'Detach Instance',
      icon: 'unwrap',
      handler: () => store.detachComponentInstance(node.id),
      hidden: !isComponent,
    },
    separator(),
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      shortcut: '⌫',
      danger: true,
      handler: () => store.removeNode(node.id),
      hidden: isBody,
    },
  ]
}

export function buildComponentActions(componentType: NodeType): ContextMenuItem[] {
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
      handler: () => store.addNode(componentType),
    },
    {
      id: 'add-inside-selected',
      label: 'Add Inside Selected',
      icon: 'add',
      handler: () => {
        if (selectedNode) store.addNode(componentType, {}, selectedNode.id, 'inside')
      },
      hidden: !selectedNode || !selectedIsContainer,
    },
  ]
}
