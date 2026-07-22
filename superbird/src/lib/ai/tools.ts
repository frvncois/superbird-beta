import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useLocalesStore } from '@/stores/locales'
import { AI_TOOL_DEFS } from '@shared/aiTools'
import type { AiToolDef } from '@shared/types'
import type {
  ActionProperty,
  CanvasNode,
  ClassOp,
  InteractionAction,
  NodeLink,
  NodeType,
  PageType,
  StyleState,
  Breakpoint,
  TargetType,
  TriggerType,
} from '@/types/canvas'

// Executors for the shared tool schemas (AI_TOOL_DEFS). These run in the browser
// against the live Pinia stores — edits autosave and are undoable. Keyed by tool
// name so the in-app agent and the MCP live-bridge share one implementation.

export const TOOL_DEFS: AiToolDef[] = AI_TOOL_DEFS

// ── helpers ──
function findById(id: string): CanvasNode | null {
  const c = useCanvasStore()
  if (id === c.bodyNode.id) return c.bodyNode
  return c.findNode(c.bodyNode.children, id)
}

function summarize(node: CanvasNode, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = { id: node.id, type: node.type }
  if (node.label && node.label !== node.type) out.label = node.label
  if (node.classes.length) out.classes = node.classes
  const content = node.content
  if (content) out.content = content.length > 80 ? content.slice(0, 80) + '…' : content
  if (node.link?.url || node.link?.currentEntry) out.link = node.link.currentEntry ? 'currentEntry' : node.link.url
  if (node.interactions?.length) out.interactions = node.interactions.length
  if (node.children.length) {
    out.children = depth < 12 ? node.children.map((c) => summarize(c, depth + 1)) : `${node.children.length} children`
  }
  return out
}

function err(msg: string): never {
  throw new Error(msg)
}

type Input = Record<string, unknown>

const EXECUTORS: Record<string, (input: Input) => string> = {
  get_overview() {
    const c = useCanvasStore()
    const s = useGlobalStylesStore()
    const col = useCollectionsStore()
    const loc = useLocalesStore()
    return JSON.stringify({
      activePageId: c.activePageId,
      selectedNodeId: c.selectedNodeId,
      pages: c.pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug, pageType: p.pageType })),
      collections: col.collections.map((cl) => ({ id: cl.id, name: cl.name, basePath: cl.basePath, templatePageId: cl.templatePageId })),
      locales: loc.locales.map((l) => ({ code: l.code, label: l.label })),
      defaultLocale: loc.defaultLocale,
      styleClasses: s.allClassNames,
      colors: Object.keys(s.globalStyles.colors),
      fonts: Object.keys(s.globalStyles.fonts),
      sizes: Object.keys(s.globalStyles.sizes),
    })
  },
  get_page_tree(input) {
    const c = useCanvasStore()
    const pageId = (input.pageId as string) || c.activePageId
    const page = c.pages.find((p) => p.id === pageId)
    if (!page) err(`No page with id ${pageId}`)
    return JSON.stringify(summarize(page!.body))
  },
  get_node(input) {
    const node = findById(input.nodeId as string)
    if (!node) err(`No node ${input.nodeId} on the active page`)
    return JSON.stringify({
      id: node!.id, type: node!.type, tag: node!.tag, label: node!.label,
      classes: node!.classes, styles: node!.styles, props: node!.props,
      content: node!.content, link: node!.link, interactions: node!.interactions,
      visibility: node!.visibility, accessibility: node!.accessibility, dynamicField: node!.dynamicField,
    })
  },
  create_page(input) {
    const c = useCanvasStore()
    const page = c.addPage(input.name as string, input.slug as string | undefined, (input.pageType as PageType) ?? 'page')
    return `Created page "${page.name}" (id: ${page.id}), now active.`
  },
  set_active_page(input) {
    const c = useCanvasStore()
    if (!c.pages.some((p) => p.id === input.pageId)) err(`No page ${input.pageId}`)
    c.setActivePage(input.pageId as string)
    return `Active page set to ${input.pageId}.`
  },
  add_node(input) {
    const c = useCanvasStore()
    const overrides: Partial<CanvasNode> = {}
    if (typeof input.content === 'string') overrides.content = input.content
    if (typeof input.tag === 'string') overrides.tag = input.tag
    if (typeof input.label === 'string') overrides.label = input.label
    if (input.props && typeof input.props === 'object') overrides.props = input.props as Record<string, string>
    const parentId = input.parentId as string | undefined
    const position = (input.position as 'inside' | 'before' | 'after') ?? 'inside'
    const node = c.addNode(input.type as NodeType, overrides, parentId, parentId ? position : undefined)
    if (!node) err('Failed to add node')
    for (const cls of (input.classes as string[]) ?? []) c.addClassToNode(node!.id, cls)
    return `Added ${input.type} (id: ${node!.id}).`
  },
  update_node(input) {
    const c = useCanvasStore()
    const id = input.nodeId as string
    const node = findById(id)
    if (!node) err(`No node ${id}`)
    const patch: Record<string, unknown> = {}
    if (typeof input.content === 'string') patch.content = input.content
    if (typeof input.tag === 'string') patch.tag = input.tag
    if (typeof input.label === 'string') patch.label = input.label
    if (input.props && typeof input.props === 'object') patch.props = { ...node!.props, ...(input.props as object) }
    if (Object.keys(patch).length) c.updateNode(id, patch)
    for (const cls of (input.removeClasses as string[]) ?? []) c.removeClassFromNode(id, cls)
    for (const cls of (input.addClasses as string[]) ?? []) c.addClassToNode(id, cls)
    return `Updated node ${id}.`
  },
  set_node_content(input) {
    const c = useCanvasStore()
    if (!findById(input.nodeId as string)) err(`No node ${input.nodeId}`)
    c.setNodeContent(input.nodeId as string, input.text as string)
    return `Set content of ${input.nodeId}.`
  },
  move_node(input) {
    const c = useCanvasStore()
    c.moveNode(input.nodeId as string, input.targetId as string, input.position as 'inside' | 'before' | 'after')
    return `Moved ${input.nodeId}.`
  },
  duplicate_node(input) {
    const c = useCanvasStore()
    c.duplicateNode(input.nodeId as string)
    return `Duplicated ${input.nodeId}.`
  },
  delete_node(input) {
    const c = useCanvasStore()
    c.removeNode(input.nodeId as string)
    return `Deleted ${input.nodeId}.`
  },
  set_node_link(input) {
    const c = useCanvasStore()
    if (!findById(input.nodeId as string)) err(`No node ${input.nodeId}`)
    const link: NodeLink = {}
    if (input.currentEntry) link.currentEntry = true
    else if (typeof input.pageSlug === 'string') link.url = input.pageSlug === '/' ? '/' : `/${(input.pageSlug as string).replace(/^\//, '')}`
    else if (typeof input.url === 'string') link.url = input.url
    if (input.target === '_self' || input.target === '_blank') link.target = input.target
    c.setNodeSettings(input.nodeId as string, { link })
    return `Set link on ${input.nodeId}.`
  },
  create_style_class(input) {
    const s = useGlobalStylesStore()
    const name = input.name as string
    if (!s.styleClasses[name]) s.createStyleClass(name)
    const styles = (input.styles as Record<string, string>) ?? {}
    for (const [k, v] of Object.entries(styles)) {
      s.updateClassStyle(name, k, String(v), (input.state as StyleState) ?? 'default', (input.breakpoint as Breakpoint) ?? 'desktop')
    }
    return `Style class ".${name}" ready.`
  },
  set_node_styles(input) {
    const c = useCanvasStore()
    const s = useGlobalStylesStore()
    const id = input.nodeId as string
    const node = findById(id)
    if (!node) err(`No node ${id}`)
    const styles = (input.styles as Record<string, string>) ?? {}
    const className = input.className as string | undefined
    if (className) {
      if (!s.styleClasses[className]) s.createStyleClass(className)
      if (!node!.classes.includes(className)) c.addClassToNode(id, className)
      for (const [k, v] of Object.entries(styles)) {
        s.updateClassStyle(className, k, String(v), (input.state as StyleState) ?? 'default', (input.breakpoint as Breakpoint) ?? 'desktop')
      }
      return `Styled ${id} via class ".${className}".`
    }
    c.updateNode(id, { styles: { ...node!.styles, ...styles } })
    return `Set instance styles on ${id}.`
  },
  set_global_token(input) {
    const s = useGlobalStylesStore()
    const name = input.name as string
    const value = input.value as string
    if (input.kind === 'color') s.setGlobalColor(name, value)
    else if (input.kind === 'font') s.setGlobalFont(name, value)
    else s.setGlobalSize(name, value)
    return `Set ${input.kind} token "${name}".`
  },
  add_interaction(input) {
    const c = useCanvasStore()
    const id = input.nodeId as string
    if (!findById(id)) err(`No node ${id}`)
    const ix = c.addInteraction(id, input.trigger as TriggerType)
    if (!ix) err('Could not create interaction')
    const target = { type: (input.target as TargetType) ?? 'self', value: input.targetValue as string | undefined }
    const step = c.addStep(id, ix!.id, target)
    if (!step) err('Could not create step')
    c.updateStep(id, ix!.id, step!.id, {
      duration: (input.duration as number) ?? 600,
      delay: (input.delay as number) ?? 0,
      easing: (input.easing as string) ?? 'cubic-bezier(0.22, 1, 0.36, 1)',
    })
    for (const a of (input.animations as Array<{ property: string; from: string; to: string }>) ?? []) {
      c.addActionToStep(id, ix!.id, step!.id, { property: a.property as ActionProperty, from: a.from, to: a.to } as InteractionAction)
    }
    const ca = input.classAction as { op: string; className: string } | undefined
    if (ca?.className) {
      c.addActionToStep(id, ix!.id, step!.id, { type: 'class', op: ca.op as ClassOp, className: ca.className } as InteractionAction)
    }
    return `Added ${input.trigger} interaction to ${id}.`
  },
  create_collection(input) {
    const c = useCanvasStore()
    const col = useCollectionsStore()
    const name = input.name as string
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const page = c.addPage(name, slug, 'collection')
    const collection = col.addCollection({ name, templatePageId: page.id })
    return `Created collection "${name}" (id: ${collection.id}, template page: ${page.id}).`
  },
  add_entry(input) {
    const col = useCollectionsStore()
    const entry = col.addEntry(input.collectionId as string)
    return `Added entry (id: ${entry.id}).`
  },
  set_entry_value(input) {
    const col = useCollectionsStore()
    col.setEntryValue(input.entryId as string, input.key as string, input.value as string)
    return `Set ${input.key} on entry ${input.entryId}.`
  },
  add_locale(input) {
    const loc = useLocalesStore()
    loc.addLocale({ code: input.code as string, label: input.label as string, flag: (input.flag as string) ?? '' })
    return `Added locale ${input.code}.`
  },
  set_translation(input) {
    const c = useCanvasStore()
    const loc = useLocalesStore()
    if (!findById(input.nodeId as string)) err(`No node ${input.nodeId}`)
    loc.setActiveLocale(input.localeCode as string)
    c.setNodeContent(input.nodeId as string, input.text as string)
    return `Set ${input.localeCode} translation on ${input.nodeId}.`
  },
}

export function runTool(name: string, input: Input): { content: string; isError: boolean } {
  const exec = EXECUTORS[name]
  if (!exec) return { content: `Unknown tool: ${name}`, isError: true }
  try {
    return { content: exec(input ?? {}), isError: false }
  } catch (e) {
    return { content: e instanceof Error ? e.message : 'Tool failed', isError: true }
  }
}
