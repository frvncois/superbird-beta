import type { AiToolDef } from './types'

// Single source of truth for the assistant's tool schemas — shared by the
// in-app agent (browser executors), the headless server executor, and the MCP
// server. Keep the executors (src/lib/ai/tools.ts, server/lib/mcpHeadless.ts)
// in sync with these names.

const NODE_TYPES = [
  'section', 'div', 'heading', 'text', 'markdown',
  'link', 'span', 'list', 'list-item', 'blockquote', 'image', 'video', 'embed',
  'form', 'input', 'textarea', 'select', 'checkbox', 'radio', 'label', 'button',
  'collection-list', 'collection-item',
]

export const AI_TOOL_DEFS: AiToolDef[] = [
  {
        name: 'get_overview',
        description:
          'Get a high-level map of the whole site: pages, collections, locales, existing style-class names, and design tokens (colors/fonts/sizes). Call this first to understand what exists.',
        input_schema: { type: 'object', properties: {} },
      },
  {
        name: 'get_page_tree',
        description: 'Get the node tree of a page (defaults to the active page). Returns a compact summary of every node with its id, type, classes and content.',
        input_schema: { type: 'object', properties: { pageId: { type: 'string', description: 'Page id; omit for the active page.' } } },
      },
  {
        name: 'get_node',
        description: 'Get the full detail of one node on the active page: classes, instance styles, props, link, interactions, settings.',
        input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
      },
  {
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
  {
        name: 'set_active_page',
        description: 'Switch the active page (edits target the active page).',
        input_schema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] },
      },
  {
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
  {
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
  {
        name: 'set_node_content',
        description: 'Set a node’s text content in the current locale (for text/heading/button/link/markdown).',
        input_schema: { type: 'object', properties: { nodeId: { type: 'string' }, text: { type: 'string' } }, required: ['nodeId', 'text'] },
      },
  {
        name: 'move_node',
        description: 'Move a node relative to a target node.',
        input_schema: {
          type: 'object',
          properties: { nodeId: { type: 'string' }, targetId: { type: 'string' }, position: { type: 'string', enum: ['inside', 'before', 'after'] } },
          required: ['nodeId', 'targetId', 'position'],
        },
      },
  {
        name: 'duplicate_node',
        description: 'Duplicate a node (with all its children and settings).',
        input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
      },
  {
        name: 'delete_node',
        description: 'Delete a node and its children.',
        input_schema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
      },
  {
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
  {
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
  {
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
  {
        name: 'set_global_token',
        description: 'Set a global design token (a reusable color/font/size). Colors are hex; sizes like "16px"; fonts a CSS font stack.',
        input_schema: {
          type: 'object',
          properties: { kind: { type: 'string', enum: ['color', 'font', 'size'] }, name: { type: 'string' }, value: { type: 'string' } },
          required: ['kind', 'name', 'value'],
        },
      },
  {
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
  {
        name: 'create_collection',
        description: 'Create a CMS collection (content type). Also creates its template page. Returns the collection id and template page id. Build the item layout on the template with add_node using dynamic fields.',
        input_schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      },
  {
        name: 'add_entry',
        description: 'Add a blank entry (item) to a collection. Returns the entry id.',
        input_schema: { type: 'object', properties: { collectionId: { type: 'string' } }, required: ['collectionId'] },
      },
  {
        name: 'set_entry_value',
        description: 'Set a field value on a collection entry. key is the field key (a template node’s dynamicField).',
        input_schema: { type: 'object', properties: { entryId: { type: 'string' }, key: { type: 'string' }, value: { type: 'string' } }, required: ['entryId', 'key', 'value'] },
      },
  {
        name: 'add_locale',
        description: 'Add a language/locale for translations (e.g. code "fr", label "French").',
        input_schema: { type: 'object', properties: { code: { type: 'string' }, label: { type: 'string' }, flag: { type: 'string' } }, required: ['code', 'label'] },
      },
  {
        name: 'set_translation',
        description: 'Set a node’s translated content for a locale (switches the active locale, then writes the text).',
        input_schema: { type: 'object', properties: { nodeId: { type: 'string' }, localeCode: { type: 'string' }, text: { type: 'string' } }, required: ['nodeId', 'localeCode', 'text'] },
      },
]
