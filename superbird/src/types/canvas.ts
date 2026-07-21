export type NodeType =
  | 'body'
  // Layout
  | 'container'
  | 'section'
  | 'columns'
  | 'column'
  | 'div'
  // Typography
  | 'heading'
  | 'text'
  | 'link'
  | 'span'
  | 'list'
  | 'list-item'
  | 'blockquote'
  // Media
  | 'image'
  | 'video'
  | 'embed'
  // Form
  | 'form'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'label'
  | 'file-upload'
  // Interactive
  | 'button'
  | 'link-block'
  // Data
  | 'collection-list'
  | 'collection-item'
  // System
  | 'component'

export type StyleState = 'default' | 'hover' | 'focus' | 'active' | 'visited'

export const STYLE_STATES: { key: StyleState; label: string; color: string }[] = [
  { key: 'default', label: 'Default', color: '#a0a3a6' },
  { key: 'hover', label: 'Hover', color: '#6366f1' },
  { key: 'focus', label: 'Focus', color: '#22c55e' },
  { key: 'active', label: 'Active', color: '#f59e0b' },
]

export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

export const BREAKPOINTS: { key: Breakpoint; label: string; icon: string; width: number }[] = [
  { key: 'desktop', label: 'Desktop', icon: 'desktop', width: 1280 },
  { key: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', icon: 'mobile', width: 375 },
]

type StateStyles = Record<StyleState, Record<string, string>>

export interface StyleClass {
  name: string
  styles: Record<Breakpoint, StateStyles>
}

function createStateStyles(): StateStyles {
  return { default: {}, hover: {}, focus: {}, active: {}, visited: {} }
}

export function createStyleClassStyles(): Record<Breakpoint, StateStyles> {
  return {
    desktop: createStateStyles(),
    tablet: createStateStyles(),
    mobile: createStateStyles(),
  }
}

export interface NodeVisibility {
  hideDesktop?: boolean
  hideTablet?: boolean
  hideMobile?: boolean
  condition?: {
    field: string
    operator: 'exists' | 'not_exists' | 'equals' | 'not_equals'
    value?: string
  }
}

export interface NodeLink {
  url?: string
  target?: '_self' | '_blank'
  rel?: string
}

export interface NodeAccessibility {
  role?: string
  ariaLabel?: string
  altText?: string
  tabIndex?: number
}

export interface NodeAdvanced {
  customCssClass?: string
  codeBefore?: string
  codeAfter?: string
}

// --- Interactions ---

export type TriggerType = 'page-load' | 'scroll-into-view' | 'scroll-position' | 'click' | 'hover' | 'class-change'

export const TRIGGER_TYPES: { key: TriggerType; label: string; icon: string }[] = [
  { key: 'page-load', label: 'Page Load', icon: 'page-load' },
  { key: 'scroll-into-view', label: 'Scroll Into View', icon: 'scroll' },
  { key: 'scroll-position', label: 'Scroll Position', icon: 'scroll' },
  { key: 'click', label: 'Click', icon: 'click' },
  { key: 'hover', label: 'Hover', icon: 'hover' },
  { key: 'class-change', label: 'Class Change', icon: 'class' },
]

export type TargetType = 'self' | 'children' | 'child' | 'sibling' | 'parent' | 'class' | 'id'

export const TARGET_TYPES: { key: TargetType; label: string }[] = [
  { key: 'self', label: 'Self' },
  { key: 'children', label: 'All Children' },
  { key: 'child', label: 'Specific Child' },
  { key: 'sibling', label: 'Sibling' },
  { key: 'parent', label: 'Parent' },
  { key: 'class', label: 'By Class' },
  { key: 'id', label: 'By ID' },
]

export type ActionProperty =
  | 'opacity'
  | 'translateX' | 'translateY' | 'translateZ'
  | 'scaleX' | 'scaleY'
  | 'rotateX' | 'rotateY' | 'rotateZ'
  | 'width' | 'height'
  | 'background-color' | 'color'
  | 'blur' | 'brightness' | 'contrast' | 'saturate'

export const ACTION_PROPERTIES: { key: ActionProperty; label: string; group: string; unit?: string }[] = [
  { key: 'opacity', label: 'Opacity', group: 'Fade' },
  { key: 'translateX', label: 'Move X', group: 'Move', unit: 'px' },
  { key: 'translateY', label: 'Move Y', group: 'Move', unit: 'px' },
  { key: 'translateZ', label: 'Move Z', group: 'Move', unit: 'px' },
  { key: 'scaleX', label: 'Scale X', group: 'Scale' },
  { key: 'scaleY', label: 'Scale Y', group: 'Scale' },
  { key: 'rotateX', label: 'Rotate X', group: 'Rotate', unit: 'deg' },
  { key: 'rotateY', label: 'Rotate Y', group: 'Rotate', unit: 'deg' },
  { key: 'rotateZ', label: 'Rotate Z', group: 'Rotate', unit: 'deg' },
  { key: 'width', label: 'Width', group: 'Size', unit: 'px' },
  { key: 'height', label: 'Height', group: 'Size', unit: 'px' },
  { key: 'background-color', label: 'Bg Color', group: 'Color' },
  { key: 'color', label: 'Text Color', group: 'Color' },
  { key: 'blur', label: 'Blur', group: 'Filter', unit: 'px' },
  { key: 'brightness', label: 'Brightness', group: 'Filter' },
  { key: 'contrast', label: 'Contrast', group: 'Filter' },
  { key: 'saturate', label: 'Saturate', group: 'Filter' },
]

export const EASING_OPTIONS: { key: string; label: string }[] = [
  { key: 'ease', label: 'Ease' },
  { key: 'ease-in', label: 'Ease In' },
  { key: 'ease-out', label: 'Ease Out' },
  { key: 'ease-in-out', label: 'Ease In Out' },
  { key: 'linear', label: 'Linear' },
  { key: 'cubic-bezier(0.22, 1, 0.36, 1)', label: 'Spring' },
  { key: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Smooth' },
]

export interface InteractionAction {
  property: ActionProperty
  from: string
  to: string
}

export interface InteractionTarget {
  type: TargetType
  value?: string
}

export interface InteractionStep {
  id: string
  target: InteractionTarget
  delay: number
  duration: number
  easing: string
  stagger?: number
  actions: InteractionAction[]
}

export interface InteractionOptions {
  loop?: boolean
  loopCount?: number
  resetOnExit?: boolean
}

export interface Interaction {
  id: string
  name: string
  trigger: TriggerType
  triggerValue?: string
  steps: InteractionStep[]
  options: InteractionOptions
}

let interactionIdCounter = 0
export function generateInteractionId(): string {
  return `ix-${++interactionIdCounter}`
}

let stepIdCounter = 0
export function generateStepId(): string {
  return `step-${++stepIdCounter}`
}

export interface CanvasNode {
  id: string
  type: NodeType
  tag: string
  label: string
  content?: string
  dynamicField?: string
  componentId?: string
  contentOverrides?: Record<string, string>
  classes: string[]
  children: CanvasNode[]
  styles: Record<string, string>
  props: Record<string, string>
  htmlId?: string
  htmlTitle?: string
  customAttributes?: Record<string, string>
  visibility?: NodeVisibility
  link?: NodeLink
  accessibility?: NodeAccessibility
  advanced?: NodeAdvanced
  interactions?: Interaction[]
  translations?: Record<string, string>
}

// --- Locales ---

export interface Locale {
  code: string
  label: string
  flag: string
}

export const DEFAULT_LOCALES: Locale[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'fr', label: 'French', flag: 'FR' },
  { code: 'es', label: 'Spanish', flag: 'ES' },
  { code: 'de', label: 'German', flag: 'DE' },
  { code: 'it', label: 'Italian', flag: 'IT' },
  { code: 'pt', label: 'Portuguese', flag: 'PT' },
  { code: 'nl', label: 'Dutch', flag: 'NL' },
  { code: 'ja', label: 'Japanese', flag: 'JA' },
  { code: 'zh', label: 'Chinese', flag: 'ZH' },
  { code: 'ko', label: 'Korean', flag: 'KO' },
  { code: 'ar', label: 'Arabic', flag: 'AR' },
  { code: 'ru', label: 'Russian', flag: 'RU' },
]

export interface UserComponent {
  id: string
  name: string
  tree: CanvasNode
}

// --- Page Types ---

export type PageType = 'page' | 'post-template' | 'product-template' | 'archive-template' | 'system'

export interface PageTypeConfig {
  key: PageType
  label: string
  plural: string
  allowMultiple: boolean
  dynamicFields?: DynamicField[]
}

export interface DynamicField {
  key: string
  label: string
  type: 'text' | 'image' | 'richtext' | 'date' | 'list' | 'number' | 'action'
  placeholder?: string
}

export const PAGE_TYPE_CONFIGS: PageTypeConfig[] = [
  {
    key: 'page',
    label: 'Page',
    plural: 'Pages',
    allowMultiple: true,
  },
  {
    key: 'post-template',
    label: 'Post Template',
    plural: 'Post Templates',
    allowMultiple: true,
    dynamicFields: [
      { key: 'post_title', label: 'Post Title', type: 'text', placeholder: 'Blog Post Title' },
      { key: 'post_content', label: 'Post Content', type: 'richtext', placeholder: 'Post content goes here...' },
      { key: 'post_excerpt', label: 'Excerpt', type: 'text', placeholder: 'A short excerpt of the post...' },
      { key: 'post_featured_image', label: 'Featured Image', type: 'image' },
      { key: 'post_date', label: 'Date', type: 'date', placeholder: 'January 1, 2026' },
      { key: 'post_author', label: 'Author', type: 'text', placeholder: 'John Doe' },
      { key: 'post_categories', label: 'Categories', type: 'list', placeholder: 'Design, Development' },
      { key: 'post_tags', label: 'Tags', type: 'list', placeholder: 'css, vue, webflow' },
    ],
  },
  {
    key: 'product-template',
    label: 'Product Template',
    plural: 'Product Templates',
    allowMultiple: true,
    dynamicFields: [
      { key: 'product_title', label: 'Product Title', type: 'text', placeholder: 'Product Name' },
      { key: 'product_price', label: 'Price', type: 'number', placeholder: '$29.99' },
      { key: 'product_description', label: 'Description', type: 'richtext', placeholder: 'Product description...' },
      { key: 'product_gallery', label: 'Gallery', type: 'image' },
      { key: 'product_add_to_cart', label: 'Add to Cart', type: 'action' },
      { key: 'product_sku', label: 'SKU', type: 'text', placeholder: 'SKU-001' },
      { key: 'product_rating', label: 'Rating', type: 'number', placeholder: '4.5' },
      { key: 'product_related', label: 'Related Products', type: 'list' },
    ],
  },
  {
    key: 'archive-template',
    label: 'Archive Template',
    plural: 'Archive Templates',
    allowMultiple: true,
    dynamicFields: [
      { key: 'archive_title', label: 'Archive Title', type: 'text', placeholder: 'Category Name' },
      { key: 'archive_description', label: 'Archive Description', type: 'text', placeholder: 'Category description...' },
      { key: 'archive_post_loop', label: 'Post Loop', type: 'list' },
      { key: 'archive_pagination', label: 'Pagination', type: 'action' },
    ],
  },
  {
    key: 'system',
    label: 'System Page',
    plural: 'System',
    allowMultiple: true,
  },
]

export function getPageTypeConfig(type: PageType): PageTypeConfig {
  return PAGE_TYPE_CONFIGS.find((c) => c.key === type)!
}

export interface Page {
  id: string
  name: string
  slug: string
  pageType: PageType
  body: CanvasNode
}

let pageIdCounter = 0

export function createPage(name: string, slug?: string, pageType: PageType = 'page'): Page {
  return {
    id: `page-${++pageIdCounter}`,
    name,
    slug: slug ?? name.toLowerCase().replace(/\s+/g, '-'),
    pageType,
    body: createNode('body'),
  }
}

// --- Collection Sources ---

export type CollectionSource = 'posts' | 'products' | 'categories' | 'tags' | 'pages'

export interface CollectionSourceConfig {
  key: CollectionSource
  label: string
  fields: DynamicField[]
}

export const COLLECTION_SOURCES: CollectionSourceConfig[] = [
  {
    key: 'posts',
    label: 'Blog Posts',
    fields: [
      { key: 'post_title', label: 'Title', type: 'text', placeholder: 'Post Title' },
      { key: 'post_content', label: 'Content', type: 'richtext', placeholder: 'Post content...' },
      { key: 'post_excerpt', label: 'Excerpt', type: 'text', placeholder: 'A short excerpt...' },
      { key: 'post_featured_image', label: 'Featured Image', type: 'image' },
      { key: 'post_date', label: 'Date', type: 'date', placeholder: 'Jan 1, 2026' },
      { key: 'post_author', label: 'Author', type: 'text', placeholder: 'John Doe' },
      { key: 'post_categories', label: 'Categories', type: 'list', placeholder: 'Design, Dev' },
      { key: 'post_tags', label: 'Tags', type: 'list', placeholder: 'css, vue' },
      { key: 'post_permalink', label: 'Permalink', type: 'text', placeholder: '/blog/post-slug' },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    fields: [
      { key: 'product_title', label: 'Title', type: 'text', placeholder: 'Product Name' },
      { key: 'product_price', label: 'Price', type: 'number', placeholder: '$29.99' },
      { key: 'product_description', label: 'Description', type: 'richtext', placeholder: 'Product description...' },
      { key: 'product_gallery', label: 'Image', type: 'image' },
      { key: 'product_sku', label: 'SKU', type: 'text', placeholder: 'SKU-001' },
      { key: 'product_permalink', label: 'Permalink', type: 'text', placeholder: '/products/slug' },
    ],
  },
  {
    key: 'categories',
    label: 'Categories',
    fields: [
      { key: 'cat_name', label: 'Name', type: 'text', placeholder: 'Category Name' },
      { key: 'cat_description', label: 'Description', type: 'text', placeholder: 'Category description...' },
      { key: 'cat_count', label: 'Post Count', type: 'number', placeholder: '12' },
      { key: 'cat_permalink', label: 'Permalink', type: 'text', placeholder: '/category/slug' },
    ],
  },
  {
    key: 'tags',
    label: 'Tags',
    fields: [
      { key: 'tag_name', label: 'Name', type: 'text', placeholder: 'Tag Name' },
      { key: 'tag_count', label: 'Post Count', type: 'number', placeholder: '5' },
      { key: 'tag_permalink', label: 'Permalink', type: 'text', placeholder: '/tag/slug' },
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    fields: [
      { key: 'page_title', label: 'Title', type: 'text', placeholder: 'Page Title' },
      { key: 'page_permalink', label: 'Permalink', type: 'text', placeholder: '/page-slug' },
    ],
  },
]

export function getCollectionSource(key: CollectionSource): CollectionSourceConfig | undefined {
  return COLLECTION_SOURCES.find((s) => s.key === key)
}

const nodeDefaults: Partial<Record<NodeType, Partial<Omit<CanvasNode, 'id' | 'type'>>>> = {
  // System
  body: { tag: 'body', label: 'Body', styles: { margin: '0', padding: '0' } },
  component: { tag: 'div', label: 'Component' },
  // Layout
  section: { tag: 'section', label: 'Section' },
  container: { tag: 'div', label: 'Container' },
  div: { tag: 'div', label: 'Div' },
  columns: { tag: 'div', label: 'Columns' },
  column: { tag: 'div', label: 'Column' },
  // Typography
  heading: { tag: 'h2', label: 'Heading', content: 'Heading' },
  text: { tag: 'p', label: 'Text', content: 'Start writing here...' },
  link: { tag: 'a', label: 'Link', content: 'Link text' },
  span: { tag: 'span', label: 'Span', content: 'Inline text' },
  list: { tag: 'ul', label: 'List' },
  'list-item': { tag: 'li', label: 'List Item', content: 'List item' },
  blockquote: { tag: 'blockquote', label: 'Blockquote', content: 'Quote text goes here...' },
  // Media
  image: { tag: 'img', label: 'Image' },
  video: { tag: 'video', label: 'Video' },
  embed: { tag: 'iframe', label: 'Embed' },
  // Form
  form: { tag: 'form', label: 'Form' },
  input: { tag: 'input', label: 'Input' },
  textarea: { tag: 'textarea', label: 'Textarea' },
  select: { tag: 'select', label: 'Select' },
  checkbox: { tag: 'input', label: 'Checkbox' },
  radio: { tag: 'input', label: 'Radio' },
  label: { tag: 'label', label: 'Label', content: 'Label' },
  'file-upload': { tag: 'input', label: 'File Upload' },
  // Interactive
  button: { tag: 'button', label: 'Button', content: 'Click me' },
  'link-block': { tag: 'a', label: 'Link Block' },
  // Data
  'collection-list': { tag: 'div', label: 'Collection List', props: { source: 'posts', limit: '3', orderBy: 'date', order: 'desc' } },
  'collection-item': { tag: 'div', label: 'Collection Item' },
}

// Elements that are containers
export const CONTAINER_TYPES: NodeType[] = ['body', 'container', 'section', 'columns', 'column', 'div', 'form', 'link-block', 'list', 'blockquote', 'component', 'collection-list', 'collection-item']

// Elements that support inline text editing
export const TEXT_EDITABLE_TYPES: NodeType[] = ['text', 'heading', 'button', 'link', 'span', 'label', 'list-item', 'blockquote']

// Form elements that require a form parent
export const FORM_CHILD_TYPES: NodeType[] = ['input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload', 'label']

// Elements that require a specific parent
export const PARENT_CONSTRAINTS: Partial<Record<NodeType, { parent: NodeType; wrapTag: string }>> = {
  'list-item': { parent: 'list', wrapTag: 'ul' },
  column: { parent: 'columns', wrapTag: 'div' },
}

let nodeIdCounter = 0

export function createNode(
  type: NodeType,
  overrides: Partial<Omit<CanvasNode, 'id' | 'type'>> = {},
): CanvasNode {
  const defaults = nodeDefaults[type] ?? {}
  return {
    id: `node-${++nodeIdCounter}`,
    type,
    tag: overrides.tag ?? defaults.tag ?? 'div',
    label: overrides.label ?? defaults.label ?? type,
    content: overrides.content ?? defaults.content,
    dynamicField: overrides.dynamicField,
    componentId: overrides.componentId,
    contentOverrides: overrides.contentOverrides,
    classes: overrides.classes ?? [],
    children: overrides.children ?? [],
    styles: overrides.styles ?? {},
    props: overrides.props ?? {},
  }
}

let componentIdCounter = 0

export function generateComponentId(): string {
  return `comp-${++componentIdCounter}`
}

// --- Media Library ---

export type MediaType = 'image' | 'video' | 'document' | 'audio' | 'other'

export interface MediaItem {
  id: string
  name: string
  url: string
  type: MediaType
  mimeType: string
  size: number
  width?: number
  height?: number
  folderId?: string
  tags: string[]
  alt?: string
  createdAt: string
}

export interface MediaFolder {
  id: string
  name: string
  parentId?: string
}

let mediaIdCounter = 0
export function generateMediaId(): string {
  return `media-${++mediaIdCounter}`
}

let folderIdCounter = 0
export function generateFolderId(): string {
  return `folder-${++folderIdCounter}`
}

export function getMediaTypeFromMime(mime: string): MediaType {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return 'document'
  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- Site Settings ---

export interface SiteIdentity {
  title: string
  tagline: string
  favicon?: string
  logo?: string
}

export interface SeoDefaults {
  titleFormat: string
  metaDescription: string
  socialImage?: string
  robotsNoIndex: boolean
  robotsNoFollow: boolean
  googleAnalyticsId?: string
  googleTagManagerId?: string
}

export interface CustomCode {
  headCode: string
  bodyStartCode: string
  bodyEndCode: string
  customCss: string
}

export interface Redirect {
  id: string
  from: string
  to: string
  type: '301' | '302'
}

export interface SiteIntegrations {
  googleFontsApiKey?: string
  customFonts: { name: string; url: string }[]
  formHandler?: string
  formEmail?: string
}

export interface SiteSettings {
  identity: SiteIdentity
  seo: SeoDefaults
  customCode: CustomCode
  redirects: Redirect[]
  integrations: SiteIntegrations
}

let redirectIdCounter = 0

export function createDefaultSiteSettings(): SiteSettings {
  return {
    identity: {
      title: 'My Website',
      tagline: 'A website built with Superbird',
    },
    seo: {
      titleFormat: '%page_title% | %site_title%',
      metaDescription: '',
      robotsNoIndex: false,
      robotsNoFollow: false,
    },
    customCode: {
      headCode: '',
      bodyStartCode: '',
      bodyEndCode: '',
      customCss: '',
    },
    redirects: [],
    integrations: {
      customFonts: [],
    },
  }
}

export function generateRedirectId(): string {
  return `redirect-${++redirectIdCounter}`
}

// --- Dynamic Field Helpers ---

export function getDynamicFieldsForPageType(pageType: PageType): DynamicField[] {
  const config = PAGE_TYPE_CONFIGS.find((c) => c.key === pageType)
  return config?.dynamicFields ?? []
}

export function getDynamicField(pageType: PageType, fieldKey: string): DynamicField | undefined {
  return getDynamicFieldsForPageType(pageType).find((f) => f.key === fieldKey)
}

export function fieldTypeToNodeType(fieldType: DynamicField['type']): NodeType {
  switch (fieldType) {
    case 'text':
    case 'date':
    case 'number':
      return 'text'
    case 'richtext':
      return 'container'
    case 'image':
      return 'image'
    case 'list':
      return 'container'
    case 'action':
      return 'button'
  }
}

export function fieldTypeToTag(fieldType: DynamicField['type']): string {
  switch (fieldType) {
    case 'text': return 'p'
    case 'date': return 'time'
    case 'number': return 'span'
    case 'richtext': return 'div'
    case 'image': return 'img'
    case 'list': return 'div'
    case 'action': return 'button'
  }
}

// --- Global Styles ---

export interface HeadingStyle {
  fontSize: string
  fontWeight: string
  lineHeight: string
}

export interface TypographySettings {
  baseFontSize: string
  baseLineHeight: string
  headings: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', HeadingStyle>
  paragraph: { marginBottom: string }
  link: { color: string; hoverColor: string; decoration: string }
}

export interface GlobalStyles {
  colors: Record<string, string>
  fonts: { primary: string; secondary: string }
  sizes: Record<string, string>
  typography: Record<Breakpoint, TypographySettings>
}

