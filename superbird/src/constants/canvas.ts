import type {
  ActionProperty,
  Breakpoint,
  CanvasNode,
  CollectionSource,
  CollectionSourceConfig,
  DynamicField,
  Locale,
  NodeType,
  PageType,
  PageTypeConfig,
  StyleState,
  TriggerType,
  TargetType,
} from '@/types/canvas'

// --- Styles & breakpoints ---

export const STYLE_STATES: { key: StyleState; label: string; color: string }[] = [
  { key: 'default', label: 'Default', color: '#a0a3a6' },
  { key: 'hover', label: 'Hover', color: '#6366f1' },
  { key: 'focus', label: 'Focus', color: '#22c55e' },
  { key: 'active', label: 'Active', color: '#f59e0b' },
]

export const BREAKPOINTS: { key: Breakpoint; label: string; icon: string; width: number }[] = [
  { key: 'desktop', label: 'Desktop', icon: 'desktop', width: 1280 },
  { key: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', icon: 'mobile', width: 375 },
]

// --- Interactions ---

export const TRIGGER_TYPES: { key: TriggerType; label: string; icon: string }[] = [
  { key: 'page-load', label: 'Page Load', icon: 'page-load' },
  { key: 'scroll-into-view', label: 'Scroll Into View', icon: 'scroll' },
  { key: 'scroll-position', label: 'Scroll Position', icon: 'scroll' },
  { key: 'click', label: 'Click', icon: 'click' },
  { key: 'hover', label: 'Hover', icon: 'hover' },
  { key: 'class-change', label: 'Class Change', icon: 'class' },
]

export const TARGET_TYPES: { key: TargetType; label: string }[] = [
  { key: 'self', label: 'Self' },
  { key: 'children', label: 'All Children' },
  { key: 'child', label: 'Specific Child' },
  { key: 'sibling', label: 'Sibling' },
  { key: 'parent', label: 'Parent' },
  { key: 'class', label: 'By Class' },
  { key: 'id', label: 'By ID' },
]

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

// --- Locales ---

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

// --- Page types ---

// Regular (non-collection) page groups shown in the header dropdown's Pages tab.
// Collection templates live under the Collections tab, not here.
export const PAGE_TYPE_CONFIGS: PageTypeConfig[] = [
  {
    key: 'page',
    label: 'Page',
    plural: 'Pages',
    allowMultiple: true,
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

// --- Collection sources ---

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

// --- Node defaults & element groups ---

export const nodeDefaults: Partial<Record<NodeType, Partial<Omit<CanvasNode, 'id' | 'type'>>>> = {
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
  markdown: { tag: 'div', label: 'Markdown', content: '## Markdown\n\nWrite **rich** text using _markdown_ — no toolbar needed.\n\n- Type `##` for headings\n- Wrap text in `**` for bold\n- Add [links](https://example.com)' },
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

// --- Dynamic field helpers ---

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
