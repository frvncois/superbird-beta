import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { createNode, createPage, createStyleClassStyles, createDefaultGlobalStyles, createDefaultSiteSettings, generateComponentId, generateInteractionId, generateStepId, generateRedirectId, generateMediaId, generateFolderId, getMediaTypeFromMime, getDynamicFieldsForPageType, fieldTypeToNodeType, fieldTypeToTag, BREAKPOINTS, PAGE_TYPE_CONFIGS, CONTAINER_TYPES, FORM_CHILD_TYPES, type Breakpoint, type CanvasNode, type DynamicField, type GlobalStyles, type HeadingStyle, type Interaction, type InteractionAction, type InteractionStep, type InteractionTarget, type Locale, type MediaFolder, type MediaItem, type MediaType, type NodeType, type Page, type PageType, type Redirect, type SiteSettings, type StyleClass, type StyleState, type TriggerType, type TypographySettings, type UserComponent } from '@/types/canvas'
import { demoPages, demoStyleClasses, demoGlobalStyles, demoUserComponents } from '@/data/demo'

export const useCanvasStore = defineStore('canvas', () => {
  // --- Pages ---

  const pages = ref<Page[]>(demoPages)
  const activePageId = ref(pages.value[0]!.id)

  const activePage = computed(() =>
    pages.value.find((p) => p.id === activePageId.value) ?? pages.value[0]!,
  )

  const pagesByType = computed(() => {
    const grouped: Record<PageType, Page[]> = {
      'page': [],
      'post-template': [],
      'product-template': [],
      'archive-template': [],
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

  // --- Global Styles ---

  const globalStyles = ref<GlobalStyles>(demoGlobalStyles)
  const globalStylesPanelOpen = ref(false)

  function setGlobalColor(name: string, value: string) {
    globalStyles.value.colors[name] = value
  }

  function removeGlobalColor(name: string) {
    delete globalStyles.value.colors[name]
  }

  function addGlobalColor(name: string, value: string) {
    globalStyles.value.colors[name] = value
  }

  function setGlobalFont(key: 'primary' | 'secondary', value: string) {
    globalStyles.value.fonts[key] = value
  }

  function setGlobalSize(name: string, value: string) {
    globalStyles.value.sizes[name] = value
  }

  function removeGlobalSize(name: string) {
    delete globalStyles.value.sizes[name]
  }

  function addGlobalSize(name: string, value: string) {
    globalStyles.value.sizes[name] = value
  }

  function updateTypography(bp: Breakpoint, key: keyof TypographySettings, value: any) {
    ;(globalStyles.value.typography[bp] as any)[key] = value
  }

  function updateHeadingStyle(bp: Breakpoint, tag: string, partial: Partial<HeadingStyle>) {
    const headings = globalStyles.value.typography[bp].headings
    const key = tag as keyof typeof headings
    headings[key] = { ...headings[key], ...partial }
  }

  // CSS variables generated from global styles
  const globalCssVars = computed(() => {
    const vars: Record<string, string> = {}
    for (const [name, value] of Object.entries(globalStyles.value.colors)) {
      vars[`--global-${name}`] = value
    }
    vars['--global-font-primary'] = globalStyles.value.fonts.primary
    vars['--global-font-secondary'] = globalStyles.value.fonts.secondary
    for (const [name, value] of Object.entries(globalStyles.value.sizes)) {
      vars[`--global-size-${name}`] = value
    }
    return vars
  })

  // --- Media Library ---

  const mediaItems = ref<MediaItem[]>([
    // Demo items
    { id: 'media-demo-1', name: 'hero-image.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 245000, width: 1920, height: 1080, tags: ['hero', 'banner'], createdAt: '2026-07-01' },
    { id: 'media-demo-2', name: 'team-photo.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 180000, width: 1200, height: 800, tags: ['team', 'about'], createdAt: '2026-07-05' },
    { id: 'media-demo-3', name: 'product-starter.png', url: '', type: 'image', mimeType: 'image/png', size: 95000, width: 800, height: 600, folderId: 'folder-demo-1', tags: ['product'], createdAt: '2026-07-10' },
    { id: 'media-demo-4', name: 'logo.svg', url: '', type: 'image', mimeType: 'image/svg+xml', size: 4200, tags: ['logo', 'brand'], createdAt: '2026-06-15' },
    { id: 'media-demo-5', name: 'blog-post-1.jpg', url: '', type: 'image', mimeType: 'image/jpeg', size: 320000, width: 1600, height: 900, folderId: 'folder-demo-2', tags: ['blog'], createdAt: '2026-07-15' },
    { id: 'media-demo-6', name: 'brand-guide.pdf', url: '', type: 'document', mimeType: 'application/pdf', size: 2400000, tags: ['brand'], createdAt: '2026-06-20' },
  ])
  const mediaFolders = ref<MediaFolder[]>([
    { id: 'folder-demo-1', name: 'Products' },
    { id: 'folder-demo-2', name: 'Blog' },
  ])
  const mediaLibraryOpen = ref(false)

  function addMediaItem(file: File): MediaItem {
    const item: MediaItem = {
      id: generateMediaId(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: getMediaTypeFromMime(file.type),
      mimeType: file.type,
      size: file.size,
      tags: [],
      createdAt: new Date().toISOString().split('T')[0]!,
    }
    if (item.type === 'image') {
      const img = new Image()
      img.onload = () => { item.width = img.width; item.height = img.height }
      img.src = item.url
    }
    mediaItems.value.unshift(item)
    return item
  }

  function removeMediaItem(id: string) {
    const item = mediaItems.value.find((m) => m.id === id)
    if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    mediaItems.value = mediaItems.value.filter((m) => m.id !== id)
  }

  function updateMediaItem(id: string, updates: Partial<Pick<MediaItem, 'name' | 'alt' | 'tags' | 'folderId'>>) {
    const item = mediaItems.value.find((m) => m.id === id)
    if (item) Object.assign(item, updates)
  }

  function moveMediaToFolder(itemId: string, folderId: string | undefined) {
    const item = mediaItems.value.find((m) => m.id === itemId)
    if (item) item.folderId = folderId
  }

  function addMediaFolder(name: string, parentId?: string): MediaFolder {
    const folder: MediaFolder = { id: generateFolderId(), name, parentId }
    mediaFolders.value.push(folder)
    return folder
  }

  function removeMediaFolder(id: string) {
    // Move items out of folder
    mediaItems.value.forEach((m) => { if (m.folderId === id) m.folderId = undefined })
    // Remove child folders
    mediaFolders.value.filter((f) => f.parentId === id).forEach((f) => removeMediaFolder(f.id))
    mediaFolders.value = mediaFolders.value.filter((f) => f.id !== id)
  }

  function renameMediaFolder(id: string, name: string) {
    const folder = mediaFolders.value.find((f) => f.id === id)
    if (folder) folder.name = name
  }

  // --- Site Settings ---

  const siteSettings = ref<SiteSettings>(createDefaultSiteSettings())

  function updateSiteIdentity(updates: Partial<SiteSettings['identity']>) {
    Object.assign(siteSettings.value.identity, updates)
  }

  function updateSeo(updates: Partial<SiteSettings['seo']>) {
    Object.assign(siteSettings.value.seo, updates)
  }

  function updateCustomCode(updates: Partial<SiteSettings['customCode']>) {
    Object.assign(siteSettings.value.customCode, updates)
  }

  function addRedirect(from: string, to: string, type: '301' | '302' = '301') {
    siteSettings.value.redirects.push({ id: generateRedirectId(), from, to, type })
  }

  function removeRedirect(id: string) {
    siteSettings.value.redirects = siteSettings.value.redirects.filter((r) => r.id !== id)
  }

  function updateIntegrations(updates: Partial<SiteSettings['integrations']>) {
    Object.assign(siteSettings.value.integrations, updates)
  }

  function addCustomFont(name: string, url: string) {
    siteSettings.value.integrations.customFonts.push({ name, url })
  }

  function removeCustomFont(index: number) {
    siteSettings.value.integrations.customFonts.splice(index, 1)
  }

  // --- Style Classes (global, shared across pages) ---

  const styleClasses = ref<Record<string, StyleClass>>(demoStyleClasses)
  const activeClassName = ref<string | null>(null)
  const activeState = ref<StyleState>('default')
  const activeBreakpoint = ref<Breakpoint>('desktop')

  const activeViewportWidth = computed(() =>
    BREAKPOINTS.find((b) => b.key === activeBreakpoint.value)?.width ?? 1280,
  )

  const allClassNames = computed(() => Object.keys(styleClasses.value).sort())

  function createStyleClass(name: string): StyleClass {
    const cls: StyleClass = { name, styles: createStyleClassStyles() }
    styleClasses.value[name] = cls
    return cls
  }

  function setActiveBreakpoint(bp: Breakpoint) {
    activeBreakpoint.value = bp
  }

  function updateClassStyle(name: string, key: string, value: string, state?: StyleState, breakpoint?: Breakpoint) {
    const cls = styleClasses.value[name]
    if (!cls) return
    const bp = breakpoint ?? activeBreakpoint.value
    const s = state ?? activeState.value
    if (!cls.styles[bp]) cls.styles[bp] = { default: {}, hover: {}, focus: {}, active: {}, visited: {} }
    if (!cls.styles[bp][s]) cls.styles[bp][s] = {}
    if (value) {
      cls.styles[bp][s][key] = value
    } else {
      delete cls.styles[bp][s][key]
    }
  }

  function setActiveState(state: StyleState) {
    activeState.value = state
  }

  function renameClass(oldName: string, newName: string) {
    const cls = styleClasses.value[oldName]
    if (!cls || styleClasses.value[newName]) return
    cls.name = newName
    styleClasses.value[newName] = cls
    delete styleClasses.value[oldName]
    // Update all nodes referencing the old name
    renameClassInTree(activePage.value.body, oldName, newName)
    for (const page of pages.value) {
      if (page.id !== activePageId.value) {
        renameClassInTree(page.body, oldName, newName)
      }
    }
    if (activeClassName.value === oldName) {
      activeClassName.value = newName
    }
  }

  function renameClassInTree(node: CanvasNode, oldName: string, newName: string) {
    const idx = node.classes.indexOf(oldName)
    if (idx !== -1) node.classes[idx] = newName
    for (const child of node.children) {
      renameClassInTree(child, oldName, newName)
    }
  }

  function deleteStyleClass(name: string) {
    delete styleClasses.value[name]
    // Remove from all nodes
    removeClassFromTree(activePage.value.body, name)
    for (const page of pages.value) {
      if (page.id !== activePageId.value) {
        removeClassFromTree(page.body, name)
      }
    }
    if (activeClassName.value === name) {
      activeClassName.value = null
    }
  }

  function removeClassFromTree(node: CanvasNode, name: string) {
    node.classes = node.classes.filter((c) => c !== name)
    for (const child of node.children) {
      removeClassFromTree(child, name)
    }
  }

  function addClassToNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    if (node.classes.includes(className)) return

    const isNew = !styleClasses.value[className]
    if (isNew) {
      createStyleClass(className)
    }

    // Migrate instance styles into the class if new, otherwise just discard them
    const hasInstanceStyles = Object.keys(node.styles).length > 0
    if (hasInstanceStyles) {
      if (isNew) {
        const cls = styleClasses.value[className]!
        Object.assign(cls.styles.desktop.default, node.styles)
      }
      node.styles = {}
    }

    node.classes.push(className)
    activeClassName.value = className
  }

  function removeClassFromNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    node.classes = node.classes.filter((c) => c !== className)
    if (activeClassName.value === className) {
      activeClassName.value = node.classes.length > 0 ? node.classes[node.classes.length - 1]! : null
    }
  }

  function setActiveClass(name: string | null) {
    activeClassName.value = name
  }

  function resolveStyles(node: CanvasNode, state: StyleState = 'default'): Record<string, string> {
    const merged: Record<string, string> = {}
    const bp = activeBreakpoint.value

    // Breakpoint cascade order: desktop is base, tablet overrides, mobile overrides tablet
    const cascade: Breakpoint[] =
      bp === 'mobile' ? ['desktop', 'tablet', 'mobile'] :
      bp === 'tablet' ? ['desktop', 'tablet'] :
      ['desktop']

    for (const className of node.classes) {
      const cls = styleClasses.value[className]
      if (!cls) continue
      // Apply each breakpoint in cascade order
      for (const b of cascade) {
        const bpStyles = cls.styles[b]
        if (!bpStyles) continue
        // Always apply default state first
        Object.assign(merged, bpStyles.default)
        // Layer the active state on top
        if (state !== 'default' && bpStyles[state]) {
          Object.assign(merged, bpStyles[state])
        }
      }
    }
    Object.assign(merged, node.styles)
    return merged
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

  // --- Lookups ---

  function findNode(tree: CanvasNode[], id: string): CanvasNode | null {
    for (const node of tree) {
      if (node.id === id) return node
      const found = findNode(node.children, id)
      if (found) return found
    }
    return null
  }

  function findParent(tree: CanvasNode[], id: string): { parent: CanvasNode[]; index: number } | null {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i]!.id === id) return { parent: tree, index: i }
      const found = findParent(tree[i]!.children, id)
      if (found) return found
    }
    return null
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
        const wrappedNode = formNode
        // Replace node with form wrapper for the rest of the logic
        return addNodeToTree(wrappedNode, targetId, position)
      }
    }

    // Auto-wrap: list items need a list parent
    if (type === 'list-item' && targetId) {
      const target = findNode(activePage.value.body.children, targetId)
      if (target?.type !== 'list') {
        const listNode = createNode('list')
        listNode.children.push(node)
        return addNodeToTree(listNode, targetId, position)
      }
    }

    // Auto-wrap: column needs columns parent
    if (type === 'column' && targetId) {
      const target = findNode(activePage.value.body.children, targetId)
      if (target?.type !== 'columns') {
        const columnsNode = createNode('columns')
        columnsNode.children.push(node)
        return addNodeToTree(columnsNode, targetId, position)
      }
    }

    // Auto-create: collection list gets a collection item child
    if (type === 'collection-list' && node.children.length === 0) {
      node.children.push(createNode('collection-item'))
    }

    return addNodeToTree(node, targetId, position)
  }

  function addNodeToTree(
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

  function selectNode(id: string | null) {
    selectedNodeId.value = id
    activeClassName.value = null
  }

  function setDraggedNode(id: string | null) {
    draggedNodeId.value = id
  }

  function setDraggedComponent(type: NodeType | null) {
    draggedComponentType.value = type
  }

  // --- Clipboard ---

  const clipboardNode = ref<CanvasNode | null>(null)
  const clipboardClasses = ref<string[]>([])

  function deepCloneNode(node: CanvasNode): CanvasNode {
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
        if (!styleClasses.value[cls]) createStyleClass(cls)
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

  function findParentNode(parent: CanvasNode, id: string): CanvasNode | null {
    for (const child of parent.children) {
      if (child.id === id) return parent
      const found = findParentNode(child, id)
      if (found) return found
    }
    return null
  }

  // --- User Components ---

  const userComponents = ref<Record<string, UserComponent>>(demoUserComponents)

  function createComponentFromNode(nodeId: string, name: string): UserComponent | null {
    const body = activePage.value.body
    if (nodeId === body.id) return null
    const node = findNode(body.children, nodeId)
    if (!node) return null

    const compId = generateComponentId()
    const masterTree = deepCloneNode(node)
    // Strip componentId from master tree
    clearComponentIds(masterTree)

    const comp: UserComponent = { id: compId, name, tree: masterTree }
    userComponents.value[compId] = comp

    // Convert the original node into a component instance
    node.type = 'component'
    node.componentId = compId
    node.label = name

    return comp
  }

  function clearComponentIds(node: CanvasNode) {
    delete node.componentId
    delete node.contentOverrides
    for (const child of node.children) {
      clearComponentIds(child)
    }
  }

  function instantiateComponent(compId: string): CanvasNode | null {
    const comp = userComponents.value[compId]
    if (!comp) return null

    const instance = deepCloneNode(comp.tree)
    instance.type = 'component'
    instance.componentId = compId
    instance.label = comp.name
    return instance
  }

  function addComponentToPage(compId: string, targetId?: string, position?: 'before' | 'after' | 'inside') {
    const instance = instantiateComponent(compId)
    if (!instance) return
    const body = activePage.value.body

    if (targetId && position === 'inside') {
      const target = targetId === body.id ? body : findNode(body.children, targetId)
      if (target) {
        target.children.push(instance)
        selectedNodeId.value = instance.id
        return
      }
    }

    if (targetId && (position === 'before' || position === 'after')) {
      const result = findParent(body.children, targetId)
      if (result) {
        const idx = position === 'after' ? result.index + 1 : result.index
        result.parent.splice(idx, 0, instance)
        selectedNodeId.value = instance.id
        return
      }
    }

    body.children.push(instance)
    selectedNodeId.value = instance.id
  }

  function syncComponentInstances(compId: string) {
    const comp = userComponents.value[compId]
    if (!comp) return

    // Sync across all pages
    for (const page of pages.value) {
      syncInstancesInTree(page.body, comp)
    }
  }

  function syncInstancesInTree(node: CanvasNode, comp: UserComponent) {
    if (node.componentId === comp.id && node.type === 'component') {
      // Preserve content overrides, sync structure and classes
      const overrides = collectContentOverrides(node)
      const synced = deepCloneNode(comp.tree)
      applyContentOverrides(synced, overrides)
      node.children = synced.children
      node.classes = [...synced.classes]
      node.tag = synced.tag
      node.styles = { ...synced.styles }
      node.props = { ...synced.props }
      node.label = comp.name
      // Don't recurse into component children — they're managed by the definition
      return
    }
    for (const child of node.children) {
      syncInstancesInTree(child, comp)
    }
  }

  function collectContentOverrides(node: CanvasNode): Record<string, string> {
    const overrides: Record<string, string> = {}
    if (node.contentOverrides) {
      Object.assign(overrides, node.contentOverrides)
    }
    collectContentFromTree(node, overrides)
    return overrides
  }

  function collectContentFromTree(node: CanvasNode, overrides: Record<string, string>) {
    if (node.content !== undefined) {
      overrides[node.id] = node.content
    }
    for (const child of node.children) {
      collectContentFromTree(child, overrides)
    }
  }

  function applyContentOverrides(node: CanvasNode, overrides: Record<string, string>) {
    // Content overrides are applied by position index since IDs change on clone
    // For simplicity, we let instances keep their own content via contentOverrides map
    for (const child of node.children) {
      applyContentOverrides(child, overrides)
    }
  }

  function updateComponentDefinition(compId: string, updatedNode: CanvasNode) {
    const comp = userComponents.value[compId]
    if (!comp) return
    const masterTree = deepCloneNode(updatedNode)
    clearComponentIds(masterTree)
    comp.tree = masterTree
    syncComponentInstances(compId)
  }

  function detachComponentInstance(nodeId: string) {
    const body = activePage.value.body
    const node = findNode(body.children, nodeId)
    if (!node || node.type !== 'component') return
    node.type = 'container'
    delete node.componentId
    delete node.contentOverrides
  }

  function deleteComponent(compId: string) {
    // Detach all instances first
    for (const page of pages.value) {
      detachAllInstances(page.body, compId)
    }
    delete userComponents.value[compId]
  }

  function detachAllInstances(node: CanvasNode, compId: string) {
    if (node.componentId === compId && node.type === 'component') {
      node.type = 'container'
      delete node.componentId
      delete node.contentOverrides
    }
    for (const child of node.children) {
      detachAllInstances(child, compId)
    }
  }

  function getComponentInstanceCount(compId: string): number {
    let count = 0
    for (const page of pages.value) {
      count += countInstances(page.body, compId)
    }
    return count
  }

  function countInstances(node: CanvasNode, compId: string): number {
    let count = node.componentId === compId ? 1 : 0
    for (const child of node.children) {
      count += countInstances(child, compId)
    }
    return count
  }

  // --- Dynamic Fields ---

  const activePageFields = computed<DynamicField[]>(() =>
    getDynamicFieldsForPageType(activePage.value.pageType),
  )

  function getUsedDynamicFields(): Set<string> {
    const used = new Set<string>()
    collectDynamicFields(activePage.value.body, used)
    return used
  }

  function collectDynamicFields(node: CanvasNode, used: Set<string>) {
    if (node.dynamicField) used.add(node.dynamicField)
    for (const child of node.children) {
      collectDynamicFields(child, used)
    }
  }

  function bindDynamicField(nodeId: string, fieldKey: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    const field = activePageFields.value.find((f) => f.key === fieldKey)
    if (!field) return
    node.dynamicField = fieldKey
    if (field.placeholder) node.content = field.placeholder
    node.label = field.label
  }

  function unbindDynamicField(nodeId: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    delete node.dynamicField
  }

  function addDynamicFieldElement(field: DynamicField, targetId?: string, position?: 'before' | 'after' | 'inside') {
    const nodeType = fieldTypeToNodeType(field.type)
    const tag = fieldTypeToTag(field.type)
    const node = addNode(nodeType, {
      tag,
      label: field.label,
      content: field.placeholder,
      dynamicField: field.key,
    }, targetId, position)
    return node
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

  function updateActionInStep(nodeId: string, interactionId: string, stepId: string, actionIndex: number, updates: Partial<InteractionAction>) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    const ix = node?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step || !step.actions[actionIndex]) return
    Object.assign(step.actions[actionIndex], updates)
  }

  // --- Locales ---

  const locales = ref<Locale[]>([
    { code: 'en', label: 'English', flag: 'EN' },
  ])
  const activeLocale = ref('en')
  const defaultLocale = ref('en')

  function addLocale(locale: Locale) {
    if (locales.value.some((l) => l.code === locale.code)) return
    locales.value.push(locale)
  }

  function removeLocale(code: string) {
    if (code === defaultLocale.value) return
    locales.value = locales.value.filter((l) => l.code !== code)
    if (activeLocale.value === code) {
      activeLocale.value = defaultLocale.value
    }
  }

  function setActiveLocale(code: string) {
    activeLocale.value = code
  }

  function getNodeContent(node: CanvasNode): string {
    if (activeLocale.value === defaultLocale.value) {
      return node.content ?? ''
    }
    return node.translations?.[activeLocale.value] ?? node.content ?? ''
  }

  function setNodeContent(nodeId: string, content: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return

    if (activeLocale.value === defaultLocale.value) {
      node.content = content
    } else {
      if (!node.translations) node.translations = {}
      node.translations[activeLocale.value] = content
    }
  }

  const isDefaultLocale = computed(() => activeLocale.value === defaultLocale.value)

  return {
    // Media Library
    mediaItems,
    mediaFolders,
    mediaLibraryOpen,
    addMediaItem,
    removeMediaItem,
    updateMediaItem,
    moveMediaToFolder,
    addMediaFolder,
    removeMediaFolder,
    renameMediaFolder,
    // Site Settings
    siteSettings,
    updateSiteIdentity,
    updateSeo,
    updateCustomCode,
    addRedirect,
    removeRedirect,
    updateIntegrations,
    addCustomFont,
    removeCustomFont,
    // Locales
    locales,
    activeLocale,
    defaultLocale,
    isDefaultLocale,
    addLocale,
    removeLocale,
    setActiveLocale,
    getNodeContent,
    setNodeContent,
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
    // Global Styles
    globalStyles,
    globalStylesPanelOpen,
    globalCssVars,
    setGlobalColor,
    removeGlobalColor,
    addGlobalColor,
    setGlobalFont,
    setGlobalSize,
    removeGlobalSize,
    addGlobalSize,
    updateTypography,
    updateHeadingStyle,
    // Pages
    pages,
    activePageId,
    activePage,
    pagesByType,
    setActivePage,
    addPage,
    removePage,
    renamePage,
    // Style Classes & Breakpoints
    styleClasses,
    activeClassName,
    activeState,
    activeBreakpoint,
    activeViewportWidth,
    allClassNames,
    createStyleClass,
    updateClassStyle,
    setActiveState,
    setActiveBreakpoint,
    renameClass,
    deleteStyleClass,
    addClassToNode,
    removeClassFromNode,
    setActiveClass,
    resolveStyles,
    // Canvas
    bodyNode,
    nodes,
    selectedNodeId,
    selectedNode,
    draggedNodeId,
    draggedComponentType,
    findNode,
    addNode,
    moveNode,
    updateNode,
    removeNode,
    selectNode,
    setDraggedNode,
    setDraggedComponent,
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
    // User Components
    userComponents,
    createComponentFromNode,
    addComponentToPage,
    updateComponentDefinition,
    detachComponentInstance,
    deleteComponent,
    getComponentInstanceCount,
    // Dynamic Fields
    activePageFields,
    getUsedDynamicFields,
    bindDynamicField,
    unbindDynamicField,
    addDynamicFieldElement,
  }
})
