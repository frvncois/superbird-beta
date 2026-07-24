import { getInstalledProject, getWorkingDocument, setWorkingDocument } from './project'
import { createNode, createPage, createStyleClassStyles, deepCloneNode } from '@/lib/nodeFactory'
import { findNode, findParent } from '@/lib/tree'
import { isTailwindUtility } from '@/lib/tailwindToStyles'
import type {
  Breakpoint,
  CanvasNode,
  Collection,
  Entry,
  GlobalStyles,
  Locale,
  NodeLink,
  NodeType,
  Page,
  PageType,
  StyleClass,
  StyleState,
} from '@/types/canvas'
import type { ProjectDocument } from '../../shared/types'

// Server-side tool executor for when NO editor is connected. Mutates the saved
// project document directly. A subset of the full tool set — the tools that map
// cleanly to the document JSON; the rest ask the user to open the editor.
//
// A small module-level context stands in for editor state (there's no live
// selection/active page server-side).
const ctx = { activePageId: '', activeLocale: 'en' }

interface Doc {
  design: {
    pages: Page[]
    styleClasses: Record<string, StyleClass>
    globalStyles: GlobalStyles
    locales: { locales: Locale[]; activeLocale: string; defaultLocale: string }
    userComponents: Record<string, unknown>
    siteSettings: unknown
  }
  content: { collections: Collection[]; entries: Entry[] }
}

function load(): { doc: Doc; pid: string } {
  const proj = getInstalledProject()
  if (!proj) throw new Error('No project installed.')
  const raw = getWorkingDocument(proj.id)
  if (!raw?.design) throw new Error('No saved project yet — open Superbird once to initialize it.')
  // getWorkingDocument returns the shared cached object; clone before mutating so
  // a tool that throws mid-edit can't leave uncommitted changes in the cache.
  const doc = structuredClone(raw) as unknown as Doc
  if (!doc.design.pages.some((p) => p.id === ctx.activePageId)) {
    ctx.activePageId = doc.design.pages[0]?.id ?? ''
  }
  return { doc, pid: proj.id }
}

function activePage(doc: Doc): Page {
  const p = doc.design.pages.find((x) => x.id === ctx.activePageId) ?? doc.design.pages[0]
  if (!p) throw new Error('No pages in project.')
  return p
}

function nodeIn(page: Page, id: string): CanvasNode | null {
  return id === page.body.id ? page.body : findNode(page.body.children, id)
}

function summarize(node: CanvasNode, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = { id: node.id, type: node.type }
  if (node.label && node.label !== node.type) out.label = node.label
  if (node.classes.length) out.classes = node.classes
  if (node.content) out.content = node.content.length > 80 ? node.content.slice(0, 80) + '…' : node.content
  if (node.children.length) out.children = depth < 12 ? node.children.map((c) => summarize(c, depth + 1)) : `${node.children.length} children`
  return out
}

const EDITOR_ONLY = (tool: string) => `"${tool}" needs the Superbird editor open. Open Superbird in a browser and try again.`

type Input = Record<string, unknown>

const HEADLESS: Record<string, (input: Input) => string> = {
  get_overview() {
    const { doc } = load()
    return JSON.stringify({
      activePageId: ctx.activePageId,
      pages: doc.design.pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug, pageType: p.pageType })),
      collections: doc.content.collections.map((c) => ({ id: c.id, name: c.name, basePath: c.basePath, templatePageId: c.templatePageId })),
      locales: doc.design.locales.locales.map((l) => ({ code: l.code, label: l.label })),
      styleClasses: Object.keys(doc.design.styleClasses),
      colors: Object.keys(doc.design.globalStyles.colors),
      fonts: Object.keys(doc.design.globalStyles.fonts),
      sizes: Object.keys(doc.design.globalStyles.sizes),
      note: 'No editor connected — changes are written to the saved project (visible next time you open Superbird).',
    })
  },
  get_page_tree(input) {
    const { doc } = load()
    const pageId = (input.pageId as string) || ctx.activePageId
    const page = doc.design.pages.find((p) => p.id === pageId)
    if (!page) throw new Error(`No page ${pageId}`)
    return JSON.stringify(summarize(page.body))
  },
  get_node(input) {
    const { doc } = load()
    const node = nodeIn(activePage(doc), input.nodeId as string)
    if (!node) throw new Error(`No node ${input.nodeId}`)
    return JSON.stringify(node)
  },
  create_page(input) {
    const { doc, pid } = load()
    const page = createPage(input.name as string, input.slug as string | undefined, (input.pageType as PageType) ?? 'page')
    doc.design.pages.push(page)
    ctx.activePageId = page.id
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Created page "${page.name}" (id: ${page.id}), now active.`
  },
  set_active_page(input) {
    const { doc } = load()
    if (!doc.design.pages.some((p) => p.id === input.pageId)) throw new Error(`No page ${input.pageId}`)
    ctx.activePageId = input.pageId as string
    return `Active page set to ${input.pageId}.`
  },
  add_node(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const overrides: Partial<CanvasNode> = {}
    if (typeof input.content === 'string') overrides.content = input.content
    if (typeof input.tag === 'string') overrides.tag = input.tag
    if (typeof input.label === 'string') overrides.label = input.label
    if (input.props && typeof input.props === 'object') overrides.props = input.props as Record<string, string>
    if (Array.isArray(input.classes)) overrides.classes = (input.classes as string[]).slice()
    const node = createNode(input.type as NodeType, overrides)
    const parentId = input.parentId as string | undefined
    const position = (input.position as 'inside' | 'before' | 'after') ?? 'inside'
    if (parentId && position !== 'inside') {
      const r = findParent(page.body.children, parentId)
      if (!r) throw new Error(`No parent target ${parentId}`)
      r.parent.splice(position === 'after' ? r.index + 1 : r.index, 0, node)
    } else if (parentId) {
      const p = nodeIn(page, parentId)
      if (!p) throw new Error(`No container ${parentId}`)
      p.children.push(node)
    } else {
      page.body.children.push(node)
    }
    // Register any new style classes referenced.
    for (const cls of node.classes) ensureClass(doc, cls)
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Added ${input.type} (id: ${node.id}).`
  },
  update_node(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const node = nodeIn(page, input.nodeId as string)
    if (!node) throw new Error(`No node ${input.nodeId}`)
    if (typeof input.content === 'string') node.content = input.content
    if (typeof input.tag === 'string') node.tag = input.tag
    if (typeof input.label === 'string') node.label = input.label
    if (input.props && typeof input.props === 'object') node.props = { ...node.props, ...(input.props as object) }
    for (const cls of (input.removeClasses as string[]) ?? []) node.classes = node.classes.filter((x) => x !== cls)
    for (const cls of (input.addClasses as string[]) ?? []) {
      if (!node.classes.includes(cls)) node.classes.push(cls)
      ensureClass(doc, cls)
    }
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Updated node ${input.nodeId}.`
  },
  set_node_content(input) {
    const { doc, pid } = load()
    const node = nodeIn(activePage(doc), input.nodeId as string)
    if (!node) throw new Error(`No node ${input.nodeId}`)
    node.content = input.text as string
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Set content of ${input.nodeId}.`
  },
  delete_node(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const r = findParent(page.body.children, input.nodeId as string)
    if (!r) throw new Error(`No node ${input.nodeId}`)
    r.parent.splice(r.index, 1)
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Deleted ${input.nodeId}.`
  },
  move_node(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const r = findParent(page.body.children, input.nodeId as string)
    if (!r) throw new Error(`No node ${input.nodeId}`)
    const [node] = r.parent.splice(r.index, 1)
    const position = input.position as 'inside' | 'before' | 'after'
    const targetId = input.targetId as string
    if (position === 'inside') {
      const t = nodeIn(page, targetId)
      if (!t) throw new Error(`No target ${targetId}`)
      t.children.push(node!)
    } else {
      const tr = findParent(page.body.children, targetId)
      if (!tr) throw new Error(`No target ${targetId}`)
      tr.parent.splice(position === 'after' ? tr.index + 1 : tr.index, 0, node!)
    }
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Moved ${input.nodeId}.`
  },
  duplicate_node(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const r = findParent(page.body.children, input.nodeId as string)
    if (!r) throw new Error(`No node ${input.nodeId}`)
    const clone = deepCloneNode(r.parent[r.index]!)
    r.parent.splice(r.index + 1, 0, clone)
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Duplicated ${input.nodeId} (new id: ${clone.id}).`
  },
  set_node_link(input) {
    const { doc, pid } = load()
    const node = nodeIn(activePage(doc), input.nodeId as string)
    if (!node) throw new Error(`No node ${input.nodeId}`)
    const link: NodeLink = {}
    if (input.currentEntry) link.currentEntry = true
    else if (typeof input.pageSlug === 'string') link.url = input.pageSlug === '/' ? '/' : `/${(input.pageSlug as string).replace(/^\//, '')}`
    else if (typeof input.url === 'string') link.url = input.url
    if (input.target === '_self' || input.target === '_blank') link.target = input.target
    node.link = link
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Set link on ${input.nodeId}.`
  },
  create_style_class(input) {
    const { doc, pid } = load()
    const name = input.name as string
    if (isTailwindUtility(name)) throw new Error(`"${name}" is a Tailwind utility, not a style-class name. Add it as a class instead, or pick a distinct name.`)
    ensureClass(doc, name)
    applyClassStyles(doc, name, (input.styles as Record<string, string>) ?? {}, input)
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Style class ".${name}" ready.`
  },
  set_node_styles(input) {
    const { doc, pid } = load()
    const page = activePage(doc)
    const node = nodeIn(page, input.nodeId as string)
    if (!node) throw new Error(`No node ${input.nodeId}`)
    const styles = (input.styles as Record<string, string>) ?? {}
    const className = input.className as string | undefined
    if (className) {
      if (isTailwindUtility(className)) throw new Error(`"${className}" is a Tailwind utility; add it as a class rather than styling it as a custom class.`)
      ensureClass(doc, className)
      if (!node.classes.includes(className)) node.classes.push(className)
      applyClassStyles(doc, className, styles, input)
    } else {
      node.styles = { ...node.styles, ...styles }
    }
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Styled ${input.nodeId}.`
  },
  set_global_token(input) {
    const { doc, pid } = load()
    const name = input.name as string
    const value = input.value as string
    const g = doc.design.globalStyles
    if (input.kind === 'color') g.colors[name] = value
    else if (input.kind === 'font') g.fonts[name] = value
    else g.sizes[name] = value
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Set ${input.kind} token "${name}".`
  },
  create_collection(input) {
    const { doc, pid } = load()
    const name = input.name as string
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const page = createPage(name, slug, 'collection')
    doc.design.pages.push(page)
    const id = `col_${Math.random().toString(36).slice(2, 10)}`
    doc.content.collections.push({ id, name, singular: name, plural: name, basePath: slug, templatePageId: page.id } as Collection)
    ctx.activePageId = page.id
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Created collection "${name}" (id: ${id}, template page: ${page.id}).`
  },
  add_entry(input) {
    const { doc, pid } = load()
    const id = `entry_${Math.random().toString(36).slice(2, 10)}`
    doc.content.entries.push({ id, collectionId: input.collectionId as string, title: '', slug: '', status: 'draft', values: {} } as Entry)
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Added entry (id: ${id}).`
  },
  set_entry_value(input) {
    const { doc, pid } = load()
    const entry = doc.content.entries.find((e) => e.id === input.entryId)
    if (!entry) throw new Error(`No entry ${input.entryId}`)
    entry.values[input.key as string] = input.value as string
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Set ${input.key} on entry ${input.entryId}.`
  },
  add_locale(input) {
    const { doc, pid } = load()
    doc.design.locales.locales.push({ code: input.code as string, label: input.label as string, flag: (input.flag as string) ?? '' })
    setWorkingDocument(pid, doc as unknown as ProjectDocument)
    return `Added locale ${input.code}.`
  },
  // TODO(headless): implement these two headlessly so they work with no editor
  // open. Both are just JSON on the doc but fiddly: add_interaction must build
  // the interaction → step → actions object with generated ids; set_translation
  // writes into the node's per-locale content map. Live mode (editor open)
  // already covers them via the browser executors.
  add_interaction() {
    return EDITOR_ONLY('add_interaction')
  },
  set_translation() {
    return EDITOR_ONLY('set_translation')
  },
}

function ensureClass(doc: Doc, name: string): void {
  if (doc.design.styleClasses[name]) return
  // Tailwind utilities are raw classes, not editable style-class records.
  // Creating an empty record for e.g. "flex" would permanently shadow that
  // utility for every node — styles.ts checks styleClasses[name] before the
  // utility fallback — corrupting layout in the canvas and compiled site CSS.
  // Mirror the browser's addClassToNode, which keeps utilities as raw classes.
  if (isTailwindUtility(name)) return
  doc.design.styleClasses[name] = { name, styles: createStyleClassStyles() }
}

function applyClassStyles(doc: Doc, name: string, styles: Record<string, string>, input: Input): void {
  const cls = doc.design.styleClasses[name]!
  const bp = (input.breakpoint as Breakpoint) ?? 'desktop'
  const state = (input.state as StyleState) ?? 'default'
  const target = cls.styles[bp][state]
  for (const [k, v] of Object.entries(styles)) target[k] = String(v)
}

export function runHeadless(name: string, input: Input): { content: string; isError: boolean } {
  const exec = HEADLESS[name]
  if (!exec) return { content: EDITOR_ONLY(name), isError: false }
  try {
    return { content: exec(input ?? {}), isError: false }
  } catch (e) {
    return { content: e instanceof Error ? e.message : 'Tool failed', isError: true }
  }
}
