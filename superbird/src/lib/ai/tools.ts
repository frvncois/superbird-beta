import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useLocalesStore } from '@/stores/locales'
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

// A tool the assistant can call. `run` executes against the live Pinia stores
// (this runs in the browser, so edits autosave and are undoable) and returns a
// short result string that goes back to the model.
interface Tool {
  def: AiToolDef
  run: (input: Record<string, unknown>) => string
}

const NODE_TYPES: NodeType[] = [
  'container', 'section', 'columns', 'column', 'div', 'heading', 'text', 'markdown',
  'link', 'span', 'list', 'list-item', 'blockquote', 'image', 'video', 'embed',
  'form', 'input', 'textarea', 'select', 'checkbox', 'radio', 'label', 'button',
  'link-block', 'collection-list',
]

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

function ok(msg: string): string {
  return msg
}
function err(msg: string): string {
  throw new Error(msg)
}

const TOOLS: Tool[] = [
  // ── Read ──
  {
    def: {
      name: 'get_overview',
      description:
        'Get a high-level map of the whole site: pages, collections, locales, existing style-class names, and design tokens (colors/fonts/sizes). Call this first to understand what exists.',
      input_schema: { type: 'object', properties: {} },
    },
    run() {
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
  },
  {
    def: {
      name: 'get_page_tree',
      description: 'Get the node tree of a page (defaults to the active page). Returns a compact summary of every node with its id, type, classes and content.',
      input_schema: { type: 'object', properties: { pageId: { type: 'string', description: 'Page id; omit for the active page.' } } },
    },
    run(input) {
      const c = useCanvasStore()
      const pageId = (input.pageId as string) || c.activePageId
      const page = c.pages.find((p) => p.id === pageId)
      if (!page) return err(`No page with id ${pageId}`)
      return JSON.stringify(summarize(page.body))
    },
  },
  {
    def: {
      name: 'get_node',
      description: 'Get the full detail of one node on the active page: classes, instance styles, props, link, interactions, settings.',
      input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
    },
    run(input) {
      const node = findById(input.nodeId as string)
      if (!node) return err(`No node ${input.nodeId} on the active page`)
      return JSON.stringify({
        id: node.id, type: node.type, tag: node.tag, label: node.label,
        classes: node.classes, styles: node.styles, props: node.props,
        content: node.content, link: node.link, interactions: node.interactions,
        visibility: node.visibility, accessibility: node.accessibility, dynamicField: node.dynamicField,
      })
    },
  },

  // ── Pages ──
  {
    def: {
      name: 'create_page',
      description: 'Create a new page and make it active. Returns its id.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          slug: { type: 'string', description: 'URL slug; derived from name if omitted. Use "/" for the home page.' },
          pageType: { type: 'string', enum: ['page', 'system'], description: 'Defaults to "page".' },
        },
        required: ['name'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      const page = c.addPage(input.name as string, input.slug as string | undefined, (input.pageType as PageType) ?? 'page')
      return ok(`Created page "${page.name}" (id: ${page.id}), now active.`)
    },
  },
  {
    def: {
      name: 'set_active_page',
      description: 'Switch the active page (edits target the active page).',
      input_schema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] },
    },
    run(input) {
      const c = useCanvasStore()
      if (!c.pages.some((p) => p.id === input.pageId)) return err(`No page ${input.pageId}`)
      c.setActivePage(input.pageId as string)
      return ok(`Active page set to ${input.pageId}.`)
    },
  },

  // ── Nodes ──
  {
    def: {
      name: 'add_node',
      description:
        'Add a new element to the active page. If parentId is omitted the node is appended to the page body. Returns the new node id. Set classes to style it (create style classes with create_style_class or set them as Tailwind utilities like "flex", "p-6", "text-center").',
      input_schema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: NODE_TYPES },
          parentId: { type: 'string', description: 'Container to add into; omit for the page body.' },
          position: { type: 'string', enum: ['inside', 'before', 'after'], description: 'Relative to parentId. Default "inside".' },
          content: { type: 'string', description: 'Text content for text/heading/button/link nodes.' },
          tag: { type: 'string', description: 'Override the HTML tag (e.g. h1/h2 for a heading).' },
          label: { type: 'string', description: 'Layer name shown in the editor.' },
          classes: { type: 'array', items: { type: 'string' }, description: 'Class names to apply (custom or Tailwind).' },
          props: { type: 'object', description: 'Element props (e.g. {src} for image, {placeholder} for input).' },
        },
        required: ['type'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      const overrides: Partial<CanvasNode> = {}
      if (typeof input.content === 'string') overrides.content = input.content
      if (typeof input.tag === 'string') overrides.tag = input.tag
      if (typeof input.label === 'string') overrides.label = input.label
      if (input.props && typeof input.props === 'object') overrides.props = input.props as Record<string, string>
      const parentId = input.parentId as string | undefined
      const position = (input.position as 'inside' | 'before' | 'after') ?? 'inside'
      const node = c.addNode(input.type as NodeType, overrides, parentId, parentId ? position : undefined)
      if (!node) return err('Failed to add node')
      for (const cls of (input.classes as string[]) ?? []) c.addClassToNode(node.id, cls)
      return ok(`Added ${input.type} (id: ${node.id}).`)
    },
  },
  {
    def: {
      name: 'update_node',
      description: 'Update a node: content, tag, label, props, and add/remove classes.',
      input_schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          content: { type: 'string' },
          tag: { type: 'string' },
          label: { type: 'string' },
          props: { type: 'object' },
          addClasses: { type: 'array', items: { type: 'string' } },
          removeClasses: { type: 'array', items: { type: 'string' } },
        },
        required: ['nodeId'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      const id = input.nodeId as string
      const node = findById(id)
      if (!node) return err(`No node ${id}`)
      const patch: Record<string, unknown> = {}
      if (typeof input.content === 'string') patch.content = input.content
      if (typeof input.tag === 'string') patch.tag = input.tag
      if (typeof input.label === 'string') patch.label = input.label
      if (input.props && typeof input.props === 'object') patch.props = { ...node.props, ...(input.props as object) }
      if (Object.keys(patch).length) c.updateNode(id, patch)
      for (const cls of (input.removeClasses as string[]) ?? []) c.removeClassFromNode(id, cls)
      for (const cls of (input.addClasses as string[]) ?? []) c.addClassToNode(id, cls)
      return ok(`Updated node ${id}.`)
    },
  },
  {
    def: {
      name: 'set_node_content',
      description: 'Set a node’s text content in the current locale (for text/heading/button/link/markdown).',
      input_schema: { type: 'object', properties: { nodeId: { type: 'string' }, text: { type: 'string' } }, required: ['nodeId', 'text'] },
    },
    run(input) {
      const c = useCanvasStore()
      if (!findById(input.nodeId as string)) return err(`No node ${input.nodeId}`)
      c.setNodeContent(input.nodeId as string, input.text as string)
      return ok(`Set content of ${input.nodeId}.`)
    },
  },
  {
    def: {
      name: 'move_node',
      description: 'Move a node relative to a target node.',
      input_schema: {
        type: 'object',
        properties: { nodeId: { type: 'string' }, targetId: { type: 'string' }, position: { type: 'string', enum: ['inside', 'before', 'after'] } },
        required: ['nodeId', 'targetId', 'position'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      c.moveNode(input.nodeId as string, input.targetId as string, input.position as 'inside' | 'before' | 'after')
      return ok(`Moved ${input.nodeId}.`)
    },
  },
  {
    def: {
      name: 'duplicate_node',
      description: 'Duplicate a node (with all its children and settings).',
      input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
    },
    run(input) {
      const c = useCanvasStore()
      c.duplicateNode(input.nodeId as string)
      return ok(`Duplicated ${input.nodeId}.`)
    },
  },
  {
    def: {
      name: 'delete_node',
      description: 'Delete a node and its children.',
      input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
    },
    run(input) {
      const c = useCanvasStore()
      c.removeNode(input.nodeId as string)
      return ok(`Deleted ${input.nodeId}.`)
    },
  },
  {
    def: {
      name: 'set_node_link',
      description: 'Make a node link somewhere: an external/internal url, a page (by slug), or the current collection entry.',
      input_schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          url: { type: 'string', description: 'Absolute or root-relative url (e.g. "/about" or "https://…").' },
          pageSlug: { type: 'string', description: 'Link to a page by its slug (resolved to "/slug").' },
          currentEntry: { type: 'boolean', description: 'Link a button/link inside a collection list to its own entry.' },
          target: { type: 'string', enum: ['_self', '_blank'] },
        },
        required: ['nodeId'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      if (!findById(input.nodeId as string)) return err(`No node ${input.nodeId}`)
      const link: NodeLink = {}
      if (input.currentEntry) link.currentEntry = true
      else if (typeof input.pageSlug === 'string') link.url = input.pageSlug === '/' ? '/' : `/${(input.pageSlug as string).replace(/^\//, '')}`
      else if (typeof input.url === 'string') link.url = input.url
      if (input.target === '_self' || input.target === '_blank') link.target = input.target
      c.setNodeSettings(input.nodeId as string, { link })
      return ok(`Set link on ${input.nodeId}.`)
    },
  },

  // ── Styles ──
  {
    def: {
      name: 'create_style_class',
      description:
        'Create a reusable style class and optionally set its CSS. Use this for real styling (a class can be reused and edited later). styles is a CSS map, e.g. {"display":"flex","gap":"16px","padding":"24px"}.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          styles: { type: 'object', description: 'CSS property→value map for the desktop/default state.' },
          state: { type: 'string', enum: ['default', 'hover', 'focus', 'active', 'visited'] },
          breakpoint: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] },
        },
        required: ['name'],
      },
    },
    run(input) {
      const s = useGlobalStylesStore()
      const name = input.name as string
      if (!s.styleClasses[name]) s.createStyleClass(name)
      const styles = (input.styles as Record<string, string>) ?? {}
      for (const [k, v] of Object.entries(styles)) {
        s.updateClassStyle(name, k, String(v), (input.state as StyleState) ?? 'default', (input.breakpoint as Breakpoint) ?? 'desktop')
      }
      return ok(`Style class ".${name}" ready.`)
    },
  },
  {
    def: {
      name: 'set_node_styles',
      description:
        'Style a node. Prefer className (edits a reusable style class and applies it to the node). Without className, sets one-off instance styles. styles is a CSS map. state/breakpoint target hover etc. and responsive.',
      input_schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          styles: { type: 'object' },
          className: { type: 'string', description: 'If given, edit this style class and apply it to the node.' },
          state: { type: 'string', enum: ['default', 'hover', 'focus', 'active', 'visited'] },
          breakpoint: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] },
        },
        required: ['nodeId', 'styles'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      const s = useGlobalStylesStore()
      const id = input.nodeId as string
      const node = findById(id)
      if (!node) return err(`No node ${id}`)
      const styles = (input.styles as Record<string, string>) ?? {}
      const className = input.className as string | undefined
      if (className) {
        if (!s.styleClasses[className]) s.createStyleClass(className)
        if (!node.classes.includes(className)) c.addClassToNode(id, className)
        for (const [k, v] of Object.entries(styles)) {
          s.updateClassStyle(className, k, String(v), (input.state as StyleState) ?? 'default', (input.breakpoint as Breakpoint) ?? 'desktop')
        }
        return ok(`Styled ${id} via class ".${className}".`)
      }
      c.updateNode(id, { styles: { ...node.styles, ...styles } })
      return ok(`Set instance styles on ${id}.`)
    },
  },
  {
    def: {
      name: 'set_global_token',
      description: 'Set a global design token (a reusable color/font/size). Colors are hex; sizes like "16px"; fonts a CSS font stack.',
      input_schema: {
        type: 'object',
        properties: { kind: { type: 'string', enum: ['color', 'font', 'size'] }, name: { type: 'string' }, value: { type: 'string' } },
        required: ['kind', 'name', 'value'],
      },
    },
    run(input) {
      const s = useGlobalStylesStore()
      const name = input.name as string
      const value = input.value as string
      if (input.kind === 'color') s.setGlobalColor(name, value)
      else if (input.kind === 'font') s.setGlobalFont(name, value)
      else s.setGlobalSize(name, value)
      return ok(`Set ${input.kind} token "${name}".`)
    },
  },

  // ── Interactions / animations ──
  {
    def: {
      name: 'add_interaction',
      description:
        'Add an interaction (animation and/or class change) to a node. One step is created with the given actions. animations animate a property from→to; classAction adds/removes/toggles a class on the target (great for dark-mode toggles).',
      input_schema: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          trigger: { type: 'string', enum: ['page-load', 'scroll-into-view', 'scroll-position', 'click', 'hover'] },
          target: { type: 'string', enum: ['self', 'children', 'child', 'sibling', 'parent', 'root', 'class', 'id'], description: 'What the interaction affects. Default "self".' },
          targetValue: { type: 'string', description: 'Class/id name when target is "class" or "id".' },
          duration: { type: 'number', description: 'ms (default 600).' },
          delay: { type: 'number', description: 'ms (default 0).' },
          easing: { type: 'string', description: 'CSS easing (default cubic-bezier(0.22, 1, 0.36, 1)).' },
          animations: {
            type: 'array',
            description: 'Property animations.',
            items: {
              type: 'object',
              properties: {
                property: { type: 'string', enum: ['opacity', 'translateX', 'translateY', 'scaleX', 'scaleY', 'rotateZ', 'width', 'height', 'background-color', 'color', 'blur'] },
                from: { type: 'string' },
                to: { type: 'string' },
              },
              required: ['property', 'from', 'to'],
            },
          },
          classAction: {
            type: 'object',
            properties: { op: { type: 'string', enum: ['add', 'remove', 'toggle'] }, className: { type: 'string' } },
          },
        },
        required: ['nodeId', 'trigger'],
      },
    },
    run(input) {
      const c = useCanvasStore()
      const id = input.nodeId as string
      if (!findById(id)) return err(`No node ${id}`)
      const ix = c.addInteraction(id, input.trigger as TriggerType)
      if (!ix) return err('Could not create interaction')
      const target = { type: (input.target as TargetType) ?? 'self', value: input.targetValue as string | undefined }
      const step = c.addStep(id, ix.id, target)
      if (!step) return err('Could not create step')
      c.updateStep(id, ix.id, step.id, {
        duration: (input.duration as number) ?? 600,
        delay: (input.delay as number) ?? 0,
        easing: (input.easing as string) ?? 'cubic-bezier(0.22, 1, 0.36, 1)',
      })
      const anims = (input.animations as Array<{ property: string; from: string; to: string }>) ?? []
      for (const a of anims) {
        c.addActionToStep(id, ix.id, step.id, { property: a.property as ActionProperty, from: a.from, to: a.to } as InteractionAction)
      }
      const ca = input.classAction as { op: string; className: string } | undefined
      if (ca?.className) {
        c.addActionToStep(id, ix.id, step.id, { type: 'class', op: ca.op as ClassOp, className: ca.className } as InteractionAction)
      }
      return ok(`Added ${input.trigger} interaction to ${id}.`)
    },
  },

  // ── Content: collections + locales ──
  {
    def: {
      name: 'create_collection',
      description: 'Create a CMS collection (content type). Also creates its template page. Returns the collection id and template page id. Build the item layout on the template with add_node using dynamic fields.',
      input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    },
    run(input) {
      const c = useCanvasStore()
      const col = useCollectionsStore()
      const name = input.name as string
      const slug = name.toLowerCase().replace(/\s+/g, '-')
      const page = c.addPage(name, slug, 'collection')
      const collection = col.addCollection({ name, templatePageId: page.id })
      return ok(`Created collection "${name}" (id: ${collection.id}, template page: ${page.id}).`)
    },
  },
  {
    def: {
      name: 'add_entry',
      description: 'Add a blank entry (item) to a collection. Returns the entry id.',
      input_schema: { type: 'object', properties: { collectionId: { type: 'string' } }, required: ['collectionId'] },
    },
    run(input) {
      const col = useCollectionsStore()
      const entry = col.addEntry(input.collectionId as string)
      return ok(`Added entry (id: ${entry.id}).`)
    },
  },
  {
    def: {
      name: 'set_entry_value',
      description: 'Set a field value on a collection entry. key is the field key (a template node’s dynamicField).',
      input_schema: { type: 'object', properties: { entryId: { type: 'string' }, key: { type: 'string' }, value: { type: 'string' } }, required: ['entryId', 'key', 'value'] },
    },
    run(input) {
      const col = useCollectionsStore()
      col.setEntryValue(input.entryId as string, input.key as string, input.value as string)
      return ok(`Set ${input.key} on entry ${input.entryId}.`)
    },
  },
  {
    def: {
      name: 'add_locale',
      description: 'Add a language/locale for translations (e.g. code "fr", label "French").',
      input_schema: { type: 'object', properties: { code: { type: 'string' }, label: { type: 'string' }, flag: { type: 'string' } }, required: ['code', 'label'] },
    },
    run(input) {
      const loc = useLocalesStore()
      loc.addLocale({ code: input.code as string, label: input.label as string, flag: (input.flag as string) ?? '' })
      return ok(`Added locale ${input.code}.`)
    },
  },
  {
    def: {
      name: 'set_translation',
      description: 'Set a node’s translated content for a locale (switches the active locale, then writes the text).',
      input_schema: { type: 'object', properties: { nodeId: { type: 'string' }, localeCode: { type: 'string' }, text: { type: 'string' } }, required: ['nodeId', 'localeCode', 'text'] },
    },
    run(input) {
      const c = useCanvasStore()
      const loc = useLocalesStore()
      if (!findById(input.nodeId as string)) return err(`No node ${input.nodeId}`)
      loc.setActiveLocale(input.localeCode as string)
      c.setNodeContent(input.nodeId as string, input.text as string)
      return ok(`Set ${input.localeCode} translation on ${input.nodeId}.`)
    },
  },
]

const BY_NAME = new Map(TOOLS.map((t) => [t.def.name, t]))

export const TOOL_DEFS: AiToolDef[] = TOOLS.map((t) => t.def)

export function runTool(name: string, input: Record<string, unknown>): { content: string; isError: boolean } {
  const tool = BY_NAME.get(name)
  if (!tool) return { content: `Unknown tool: ${name}`, isError: true }
  try {
    return { content: tool.run(input ?? {}), isError: false }
  } catch (e) {
    return { content: e instanceof Error ? e.message : 'Tool failed', isError: true }
  }
}
