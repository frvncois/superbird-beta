import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createNode, createPage } from '@/lib/nodeFactory'
import { buildPrebuilt } from '@/lib/prebuiltElements'
import { findNode, findParent, findParentNode } from '@/lib/tree'
import { FORM_CHILD_TYPES } from '@/constants/canvas'
import { resolveNodeContent } from '@/lib/render/context'
import { useInteractionOps } from './canvas/interactions'
import { useClipboardOps } from './canvas/clipboard'
import { useClassBindings } from './canvas/classBindings'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useLocalesStore } from '@/stores/locales'
import { useCollectionsStore } from '@/stores/collections'
import { demoPages } from '@/data/demo'
import type { CanvasNode, NodeType, Page, PageType, PrebuiltElementKey } from '@/types/canvas'

/**
 * Pages, the node tree, selection, clipboard and node-level operations.
 * Style-class definitions and design tokens live in the globalStyles store;
 * this store owns everything that touches nodes.
 */
export const useCanvasStore = defineStore('canvas', () => {
  const globalStylesStore = useGlobalStylesStore()
  const localesStore = useLocalesStore()
  const collectionsStore = useCollectionsStore()

  // --- Pages ---

  const pages = ref<Page[]>(demoPages)
  const activePageId = ref(pages.value[0]!.id)

  const activePage = computed(() =>
    pages.value.find((p) => p.id === activePageId.value) ?? pages.value[0]!,
  )

  const pagesByType = computed(() => {
    const grouped: Record<PageType, Page[]> = {
      'page': [],
      'collection': [],
      'system': [],
    }
    for (const page of pages.value) {
      grouped[page.pageType].push(page)
    }
    return grouped
  })

  const bodyNode = computed(() => activePage.value.body)
  const nodes = computed(() => activePage.value.body.children)

  function setActivePage(pageId: string) {
    activePageId.value = pageId
    selectedNodeId.value = null
    activeEntryId.value = null
  }

  // Replace all pages from a loaded project document.
  function hydratePages(loaded: Page[]) {
    pages.value = loaded
    activePageId.value = pages.value[0]?.id ?? ''
    selectedNodeId.value = null
    activeEntryId.value = null
  }

  // --- Collection / entry context ---
  // When a collection template is open, the canvas edits that template (Page
  // with pageType 'collection'). An active entry supplies field content as
  // preview data; editing a field-bound element writes to the entry.

  const activeEntryId = ref<string | null>(null)
  const activeEntry = computed(() => collectionsStore.entryById(activeEntryId.value))
  const activeCollection = computed(() =>
    collectionsStore.collectionByTemplatePage(activePageId.value) ?? null,
  )
  const isCollectionTemplate = computed(() => activePage.value.pageType === 'collection')

  // Open a collection's template with no entry (fields show placeholders).
  function openCollection(collectionId: string) {
    const collection = collectionsStore.collectionById(collectionId)
    if (!collection) return
    setActivePage(collection.templatePageId)
  }

  // Open a specific entry: its collection's template + the entry as preview.
  function openEntry(entryId: string) {
    const entry = collectionsStore.entryById(entryId)
    if (!entry) return
    const collection = collectionsStore.collectionById(entry.collectionId)
    if (!collection) return
    setActivePage(collection.templatePageId)
    activeEntryId.value = entryId
  }

  function addPage(name: string, slug?: string, pageType: PageType = 'page') {
    const page = createPage(name, slug, pageType)
    pages.value.push(page)
    setActivePage(page.id)
    return page
  }

  function removePage(pageId: string) {
    if (pages.value.length <= 1) return
    const idx = pages.value.findIndex((p) => p.id === pageId)
    if (idx === -1) return
    pages.value.splice(idx, 1)
    if (activePageId.value === pageId) {
      activePageId.value = pages.value[0]!.id
      selectedNodeId.value = null
    }
  }

  function updatePage(pageId: string, patch: Partial<Pick<Page, 'name' | 'slug' | 'status' | 'seo'>>) {
    const page = pages.value.find((p) => p.id === pageId)
    if (page) Object.assign(page, patch)
  }

  // --- Editor mode ---
  // 'design' = full editor; 'content' = distraction-free content editing
  // (sidebars hidden, outlines only on content-bearing elements). UI-only
  // state — deliberately outside the undo/redo snapshot.
  const editorMode = ref<'design' | 'content'>('design')
  function setEditorMode(mode: 'design' | 'content') {
    editorMode.value = mode
  }

  // Preview overlay (faithful published render of the active page).
  const previewOpen = ref(false)
  function openPreview() {
    previewOpen.value = true
  }
  function closePreview() {
    previewOpen.value = false
  }

  // Interactions master-detail: which interaction (of the selected node) is
  // open for editing. Cleared when the selection changes.
  const openInteractionId = ref<string | null>(null)
  function setOpenInteraction(id: string | null) {
    openInteractionId.value = id
  }

  // --- Selection & Drag ---

  const selectedNodeId = ref<string | null>(null)
  const draggedNodeId = ref<string | null>(null)
  const draggedComponentType = ref<NodeType | null>(null)

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    if (selectedNodeId.value === bodyNode.value.id) return bodyNode.value
    return findNode(bodyNode.value.children, selectedNodeId.value)
  })

  function selectNode(id: string | null) {
    selectedNodeId.value = id
    globalStylesStore.setActiveClass(null)
    openInteractionId.value = null
  }

  function setDraggedNode(id: string | null) {
    draggedNodeId.value = id
  }

  function setDraggedComponent(type: NodeType | null) {
    draggedComponentType.value = type
  }

  // --- Class <-> node bindings --- (extracted to ./canvas/classBindings.ts)
  const {
    renameClass,
    deleteStyleClass,
    duplicateClass,
    createCustomClassOnNode,
    addClassToNode,
    removeClassFromNode,
  } = useClassBindings(activePage, pages)

  // --- Node Mutations ---

  function hasAncestorOfType(nodeId: string, ancestorType: NodeType): boolean {
    let current = findParentNode(activePage.value.body, nodeId)
    while (current) {
      if (current.type === ancestorType) return true
      current = findParentNode(activePage.value.body, current.id)
    }
    return false
  }

  function addNode(
    type: NodeType,
    overrides: Partial<Omit<CanvasNode, 'id' | 'type'>> = {},
    targetId?: string,
    position?: 'before' | 'after' | 'inside',
  ) {
    const node = createNode(type, overrides)

    // Auto-wrap: form elements need a form parent
    if (FORM_CHILD_TYPES.includes(type) && targetId) {
      const inForm = hasAncestorOfType(targetId, 'form') ||
        (findNode(activePage.value.body.children, targetId)?.type === 'form')
      if (!inForm) {
        // Wrap in a form and add inside it
        const formNode = createNode('form')
        formNode.children.push(node)
        return insertNode(formNode, targetId, position)
      }
    }

    // Auto-wrap: list items need a list parent
    if (type === 'list-item' && targetId) {
      const target = findNode(activePage.value.body.children, targetId)
      if (target?.type !== 'list') {
        const listNode = createNode('list')
        listNode.children.push(node)
        return insertNode(listNode, targetId, position)
      }
    }

    // Auto-create: collection list gets a collection item child
    if (type === 'collection-list' && node.children.length === 0) {
      node.children.push(createNode('collection-item'))
    }

    return insertNode(node, targetId, position)
  }

  // Insert a prebuilt "Dynamic" element tree (lang-switcher) at the drop target.
  function addPrebuilt(key: PrebuiltElementKey, targetId?: string, position?: 'before' | 'after' | 'inside') {
    const tree = buildPrebuilt(key)
    if (!tree) return null
    return insertNode(tree, targetId, position)
  }

  function insertNode(
    node: CanvasNode,
    targetId?: string,
    position?: 'before' | 'after' | 'inside',
  ) {
    const body = activePage.value.body

    if (targetId && position === 'inside') {
      const target = targetId === body.id ? body : findNode(body.children, targetId)
      if (target) {
        target.children.push(node)
        selectedNodeId.value = node.id
        return node
      }
    }

    if (targetId && (position === 'before' || position === 'after')) {
      const result = findParent(body.children, targetId)
      if (result) {
        const idx = position === 'after' ? result.index + 1 : result.index
        result.parent.splice(idx, 0, node)
        selectedNodeId.value = node.id
        return node
      }
    }

    body.children.push(node)
    selectedNodeId.value = node.id
    return node
  }

  function moveNode(nodeId: string, targetId: string, position: 'before' | 'after' | 'inside') {
    const body = activePage.value.body
    if (nodeId === body.id) return

    const sourceResult = findParent(body.children, nodeId)
    if (!sourceResult) return

    const [node] = sourceResult.parent.splice(sourceResult.index, 1)
    if (!node) return

    if (position === 'inside') {
      const target = targetId === body.id ? body : findNode(body.children, targetId)
      if (target) {
        target.children.push(node)
        return
      }
    }

    const targetResult = findParent(body.children, targetId)
    if (targetResult) {
      const idx = position === 'after' ? targetResult.index + 1 : targetResult.index
      targetResult.parent.splice(idx, 0, node)
    }
  }

  function updateNode(id: string, updates: Partial<Pick<CanvasNode, 'content' | 'label' | 'styles' | 'props' | 'tag'>>) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    Object.assign(node, updates)
  }

  // Returns what was removed (node + its parent + index) so callers can offer
  // an "Undo" toast via restoreNode. null when nothing was removed.
  function removeNode(id: string): { node: CanvasNode; parentId: string; index: number } | null {
    const body = activePage.value.body
    if (id === body.id) return null

    const result = findParent(body.children, id)
    if (!result) return null
    const parentId = getParentId(id) ?? body.id
    const index = result.index
    const [node] = result.parent.splice(index, 1)
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
    return node ? { node, parentId, index } : null
  }

  // Re-insert a previously removed node at its original spot (undo of removeNode).
  function restoreNode(node: CanvasNode, parentId: string, index: number) {
    const body = activePage.value.body
    const parent = parentId === body.id ? body : findNode(body.children, parentId)
    if (!parent) {
      body.children.push(node)
    } else {
      const clamped = Math.min(Math.max(index, 0), parent.children.length)
      parent.children.splice(clamped, 0, node)
    }
    selectedNodeId.value = node.id
  }

  function setNodeSettings(
    id: string,
    settings: Partial<Pick<CanvasNode, 'htmlId' | 'htmlTitle' | 'customAttributes' | 'visibility' | 'link' | 'accessibility' | 'advanced' | 'dynamicField'>>,
  ) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    Object.assign(node, settings)
  }

  function setCustomAttribute(id: string, key: string, value: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    if (!node.customAttributes) node.customAttributes = {}
    node.customAttributes[key] = value
  }

  function removeCustomAttribute(id: string, key: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node?.customAttributes) return
    delete node.customAttributes[key]
  }

  // --- Clipboard & operations --- (extracted to ./canvas/clipboard.ts)
  const {
    clipboardNode,
    clipboardClasses,
    copyNode,
    pasteNode,
    duplicateNode,
    wrapInContainer,
    unwrapNode,
    moveUp,
    moveDown,
    copyClasses,
    pasteClasses,
    getNodeIndex,
    isContainerNode,
    getParentId,
  } = useClipboardOps(activePage, selectedNodeId)

  // --- Interactions --- (extracted to ./canvas/interactions.ts)
  const {
    getNodeInteractions,
    addInteraction,
    removeInteraction,
    restoreInteraction,
    updateInteraction,
    addStep,
    removeStep,
    updateStep,
    addActionToStep,
    removeActionFromStep,
    updateActionInStep,
  } = useInteractionOps(activePage)

  // --- Localized content ---

  function getNodeContent(node: CanvasNode): string {
    // Field-bound node with an entry loaded → the entry value; else locale
    // translation → authored content. Shared with SSR + Preview via the factory.
    return resolveNodeContent(node, {
      entry: activeEntry.value ?? undefined,
      locale: localesStore.activeLocale,
      defaultLocale: localesStore.defaultLocale,
    })
  }

  function setNodeContent(nodeId: string, content: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return

    // Field-bound node with an entry loaded → write the entry, not the template.
    if (node.dynamicField && activeEntry.value) {
      collectionsStore.setEntryValue(activeEntry.value.id, node.dynamicField, content)
      return
    }

    if (localesStore.isDefaultLocale) {
      node.content = content
    } else {
      if (!node.translations) node.translations = {}
      node.translations[localesStore.activeLocale] = content
    }
  }

  // Remove every reference to a media id on one page (used by the media library's
  // "Used on → Detach"). Clears the content of matching elements; returns how many.
  function detachMediaOnPage(pageId: string, mediaId: string): number {
    const page = pages.value.find((p) => p.id === pageId)
    if (!page?.body) return 0
    let cleared = 0
    const walk = (node: CanvasNode) => {
      if (node.content === mediaId) {
        node.content = ''
        cleared++
      }
      for (const child of node.children ?? []) walk(child)
    }
    walk(page.body)
    return cleared
  }

  return {
    // Pages
    pages,
    activePageId,
    activePage,
    pagesByType,
    setActivePage,
    hydratePages,
    // Collection / entry context
    activeEntryId,
    activeEntry,
    activeCollection,
    isCollectionTemplate,
    openCollection,
    openEntry,
    addPage,
    removePage,
    updatePage,
    // Editor mode
    editorMode,
    setEditorMode,
    previewOpen,
    openPreview,
    closePreview,
    openInteractionId,
    setOpenInteraction,
    // Selection & drag
    bodyNode,
    nodes,
    selectedNodeId,
    selectedNode,
    draggedNodeId,
    draggedComponentType,
    selectNode,
    setDraggedNode,
    setDraggedComponent,
    // Class <-> node bindings
    renameClass,
    deleteStyleClass,
    duplicateClass,
    createCustomClassOnNode,
    addClassToNode,
    removeClassFromNode,
    // Node mutations
    findNode,
    addNode,
    addPrebuilt,
    insertNode,
    moveNode,
    updateNode,
    removeNode,
    restoreNode,
    detachMediaOnPage,
    setNodeSettings,
    setCustomAttribute,
    removeCustomAttribute,
    // Clipboard & operations
    clipboardNode,
    clipboardClasses,
    copyNode,
    pasteNode,
    duplicateNode,
    wrapInContainer,
    unwrapNode,
    moveUp,
    moveDown,
    copyClasses,
    pasteClasses,
    getNodeIndex,
    isContainerNode,
    getParentId,
    // Interactions
    getNodeInteractions,
    addInteraction,
    removeInteraction,
    restoreInteraction,
    updateInteraction,
    addStep,
    removeStep,
    updateStep,
    addActionToStep,
    removeActionFromStep,
    updateActionInStep,
    // Localized content
    getNodeContent,
    setNodeContent,
  }
})
