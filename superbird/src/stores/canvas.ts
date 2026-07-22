import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createNode, createPage, deepCloneNode } from '@/lib/nodeFactory'
import { generateInteractionId, generateStepId, generateFieldId } from '@/lib/ids'
import { findNode, findParent, findParentNode, renameClassInTree, removeClassFromTree } from '@/lib/tree'
import { CONTAINER_TYPES, FORM_CHILD_TYPES, fieldTypeToNodeType, fieldTypeToTag } from '@/constants/canvas'
import { isTailwindUtility } from '@/lib/tailwindToStyles'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useLocalesStore } from '@/stores/locales'
import { useCollectionsStore } from '@/stores/collections'
import { demoPages } from '@/data/demo'
import type { AnimateAction, CanvasNode, ClassAction, FieldType, Interaction, InteractionAction, InteractionStep, InteractionTarget, NodeType, Page, PageType, TriggerType } from '@/types/canvas'

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

  function renamePage(pageId: string, name: string, slug?: string) {
    const page = pages.value.find((p) => p.id === pageId)
    if (!page) return
    page.name = name
    if (slug !== undefined) page.slug = slug
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

  // --- Class <-> node bindings ---

  function renameClass(oldName: string, newName: string) {
    const cls = globalStylesStore.styleClasses[oldName]
    if (!cls || globalStylesStore.styleClasses[newName]) return
    cls.name = newName
    globalStylesStore.styleClasses[newName] = cls
    delete globalStylesStore.styleClasses[oldName]
    // Update all nodes referencing the old name
    for (const page of pages.value) {
      renameClassInTree(page.body, oldName, newName)
    }
    if (globalStylesStore.activeClassName === oldName) {
      globalStylesStore.setActiveClass(newName)
    }
  }

  function deleteStyleClass(name: string) {
    delete globalStylesStore.styleClasses[name]
    // Remove from all nodes
    for (const page of pages.value) {
      removeClassFromTree(page.body, name)
    }
    if (globalStylesStore.activeClassName === name) {
      globalStylesStore.setActiveClass(null)
    }
  }

  function addClassToNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    if (node.classes.includes(className)) return

    // Tailwind utilities are raw classes — not editable style classes.
    if (isTailwindUtility(className)) {
      node.classes.push(className)
      return
    }

    const isNew = !globalStylesStore.styleClasses[className]
    if (isNew) {
      globalStylesStore.createStyleClass(className)
    }

    // Migrate instance styles into the class if new, otherwise just discard them
    const hasInstanceStyles = Object.keys(node.styles).length > 0
    if (hasInstanceStyles) {
      if (isNew) {
        const cls = globalStylesStore.styleClasses[className]!
        Object.assign(cls.styles.desktop.default, node.styles)
      }
      node.styles = {}
    }

    node.classes.push(className)
    globalStylesStore.setActiveClass(className)
  }

  function removeClassFromNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    node.classes = node.classes.filter((c) => c !== className)
    if (globalStylesStore.activeClassName === className) {
      globalStylesStore.setActiveClass(node.classes.length > 0 ? node.classes[node.classes.length - 1]! : null)
    }
  }

  // Find a class name not yet taken by any style class.
  function uniqueClassName(base: string): string {
    if (!globalStylesStore.styleClasses[base]) return base
    let n = 2
    while (globalStylesStore.styleClasses[`${base}-${n}`]) n++
    return `${base}-${n}`
  }

  // Duplicate a style class into a new one (styles copied) and swap it in on the
  // node in place of the original, so this element can diverge. Tailwind
  // utilities aren't real style classes — nothing to duplicate. Returns the new
  // name (for inline rename).
  function duplicateClass(nodeId: string, className: string): string | null {
    const cls = globalStylesStore.styleClasses[className]
    if (!cls) return null
    const newName = uniqueClassName(`${className}-copy`)
    globalStylesStore.styleClasses[newName] = {
      name: newName,
      styles: JSON.parse(JSON.stringify(cls.styles)),
    }
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (node) {
      const i = node.classes.indexOf(className)
      if (i !== -1) node.classes.splice(i, 1, newName)
    }
    globalStylesStore.setActiveClass(newName)
    return newName
  }

  // Create a fresh, empty custom style class and append it to the node. Used when
  // the user tries to edit properties while a Tailwind utility is the active
  // class — we never mutate Tailwind classes, so styling spills into a new class
  // added at the end (last wins). Returns the new name.
  function createCustomClassOnNode(nodeId: string): string {
    let name = randomClassName()
    while (globalStylesStore.styleClasses[name]) name = randomClassName()
    addClassToNode(nodeId, name)
    return name
  }

  // A short random class name (5 lowercase letters) — leading letter keeps it a
  // valid CSS identifier.
  function randomClassName(): string {
    let s = ''
    for (let i = 0; i < 5; i++) s += String.fromCharCode(97 + Math.floor(Math.random() * 26))
    return s
  }

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

    // Auto-wrap: column needs columns parent
    if (type === 'column' && targetId) {
      const target = findNode(activePage.value.body.children, targetId)
      if (target?.type !== 'columns') {
        const columnsNode = createNode('columns')
        columnsNode.children.push(node)
        return insertNode(columnsNode, targetId, position)
      }
    }

    // Auto-create: collection list gets a collection item child
    if (type === 'collection-list' && node.children.length === 0) {
      node.children.push(createNode('collection-item'))
    }

    return insertNode(node, targetId, position)
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

  function removeNode(id: string) {
    const body = activePage.value.body
    if (id === body.id) return

    const result = findParent(body.children, id)
    if (!result) return
    result.parent.splice(result.index, 1)
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
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

  // --- Clipboard ---

  const clipboardNode = ref<CanvasNode | null>(null)
  const clipboardClasses = ref<string[]>([])

  function copyNode(id: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node || node.type === 'body') return
    clipboardNode.value = deepCloneNode(node)
  }

  function pasteNode(targetId: string, position: 'before' | 'after' | 'inside') {
    if (!clipboardNode.value) return
    const clone = deepCloneNode(clipboardNode.value)
    const body = activePage.value.body

    if (position === 'inside') {
      const target = targetId === body.id ? body : findNode(body.children, targetId)
      if (target) {
        target.children.push(clone)
        selectedNodeId.value = clone.id
        return
      }
    }

    const result = findParent(body.children, targetId)
    if (result) {
      const idx = position === 'after' ? result.index + 1 : result.index
      result.parent.splice(idx, 0, clone)
      selectedNodeId.value = clone.id
    }
  }

  function duplicateNode(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result) return
    const original = result.parent[result.index]!
    const clone = deepCloneNode(original)
    result.parent.splice(result.index + 1, 0, clone)
    selectedNodeId.value = clone.id
  }

  function wrapInContainer(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result) return
    const node = result.parent[result.index]!
    const container = createNode('container', { children: [node] })
    result.parent[result.index] = container
    selectedNodeId.value = container.id
  }

  function unwrapNode(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const node = findNode(body.children, id)
    if (!node || node.children.length === 0) return
    const isContainer = ['container', 'section', 'columns', 'column'].includes(node.type)
    if (!isContainer) return

    const result = findParent(body.children, id)
    if (!result) return
    const children = [...node.children]
    result.parent.splice(result.index, 1, ...children)
    selectedNodeId.value = children[0]?.id ?? null
  }

  function moveUp(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result || result.index === 0) return
    const [node] = result.parent.splice(result.index, 1)
    result.parent.splice(result.index - 1, 0, node!)
  }

  function moveDown(id: string) {
    const body = activePage.value.body
    if (id === body.id) return
    const result = findParent(body.children, id)
    if (!result || result.index >= result.parent.length - 1) return
    const [node] = result.parent.splice(result.index, 1)
    result.parent.splice(result.index + 1, 0, node!)
  }

  function copyClasses(id: string) {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    clipboardClasses.value = [...node.classes]
  }

  function pasteClasses(id: string) {
    if (clipboardClasses.value.length === 0) return
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return
    for (const cls of clipboardClasses.value) {
      if (!node.classes.includes(cls)) {
        if (!globalStylesStore.styleClasses[cls]) globalStylesStore.createStyleClass(cls)
        node.classes.push(cls)
      }
    }
  }

  function getNodeIndex(id: string): { index: number; total: number } | null {
    const body = activePage.value.body
    const result = findParent(body.children, id)
    if (!result) return null
    return { index: result.index, total: result.parent.length }
  }

  function isContainerNode(id: string): boolean {
    const body = activePage.value.body
    const node = id === body.id ? body : findNode(body.children, id)
    if (!node) return false
    return CONTAINER_TYPES.includes(node.type)
  }

  function getParentId(id: string): string | null {
    const body = activePage.value.body
    if (id === body.id) return null
    return findParentNode(body, id)?.id ?? null
  }

  // --- Dynamic Fields ---

  // Drop a typed dynamic field from the Elements tab onto a collection
  // template: creates a NEW field (fresh key) and places its bound element.
  const FIELD_LABELS: Record<FieldType, string> = {
    text: 'Text field',
    richtext: 'Rich text field',
    image: 'Image field',
    number: 'Number field',
    date: 'Date field',
  }

  function addDynamicField(fieldType: FieldType, targetId?: string, position?: 'before' | 'after' | 'inside') {
    const label = FIELD_LABELS[fieldType]
    return addNode(fieldTypeToNodeType(fieldType), {
      tag: fieldTypeToTag(fieldType),
      label,
      content: label,
      dynamicField: generateFieldId(),
      props: { fieldType },
    }, targetId, position)
  }

  // --- Interactions ---

  function getNodeInteractions(nodeId: string): Interaction[] {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    return node?.interactions ?? []
  }

  function addInteraction(nodeId: string, trigger: TriggerType, name?: string): Interaction | null {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return null
    if (!node.interactions) node.interactions = []
    const ix: Interaction = {
      id: generateInteractionId(),
      name: name ?? `${trigger} interaction`,
      trigger,
      steps: [],
      options: {},
    }
    node.interactions.push(ix)
    return ix
  }

  function removeInteraction(nodeId: string, interactionId: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node?.interactions) return
    node.interactions = node.interactions.filter((ix) => ix.id !== interactionId)
  }

  function updateInteraction(nodeId: string, interactionId: string, updates: Partial<Pick<Interaction, 'name' | 'trigger' | 'triggerValue' | 'options'>>) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return
    Object.assign(ix, updates)
  }

  function addStep(nodeId: string, interactionId: string, target?: InteractionTarget): InteractionStep | null {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return null
    const step: InteractionStep = {
      id: generateStepId(),
      target: target ?? { type: 'self' },
      delay: 0,
      duration: 300,
      easing: 'ease-out',
      actions: [],
    }
    ix.steps.push(step)
    return step
  }

  function removeStep(nodeId: string, interactionId: string, stepId: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return
    ix.steps = ix.steps.filter((s) => s.id !== stepId)
  }

  function updateStep(nodeId: string, interactionId: string, stepId: string, updates: Partial<Pick<InteractionStep, 'target' | 'delay' | 'duration' | 'easing' | 'stagger'>>) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    Object.assign(step, updates)
  }

  function addActionToStep(nodeId: string, interactionId: string, stepId: string, action: InteractionAction) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    step.actions.push(action)
  }

  function removeActionFromStep(nodeId: string, interactionId: string, stepId: string, actionIndex: number) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    step.actions.splice(actionIndex, 1)
  }

  function updateActionInStep(nodeId: string, interactionId: string, stepId: string, actionIndex: number, updates: Partial<AnimateAction> | Partial<ClassAction>) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step || !step.actions[actionIndex]) return
    Object.assign(step.actions[actionIndex], updates)
  }

  // --- Localized content ---

  function getNodeContent(node: CanvasNode): string {
    // Field-bound node with an entry loaded → the entry's value (its content).
    if (node.dynamicField && activeEntry.value) {
      return activeEntry.value.values[node.dynamicField] ?? node.content ?? ''
    }
    if (localesStore.isDefaultLocale) {
      return node.content ?? ''
    }
    return node.translations?.[localesStore.activeLocale] ?? node.content ?? ''
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
    renamePage,
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
    insertNode,
    moveNode,
    updateNode,
    removeNode,
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
    // Dynamic fields
    addDynamicField,
    // Interactions
    getNodeInteractions,
    addInteraction,
    removeInteraction,
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
