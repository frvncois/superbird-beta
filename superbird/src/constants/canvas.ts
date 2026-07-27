import type {
  ActionProperty,
  Breakpoint,
  BreakpointDef,
  CanvasNode,
  Locale,
  NodeType,
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

// Coarse device buckets — drive responsive typography + element visibility, and
// the device icon a breakpoint shows (inferred from its width via deviceType).
export const BREAKPOINTS: { key: Breakpoint; label: string; icon: string; width: number }[] = [
  { key: 'desktop', label: 'Desktop', icon: 'desktop', width: 1280 },
  { key: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', icon: 'mobile', width: 375 },
]

// The breakpoint registry seeded into a fresh project (styling breakpoints).
export const DEFAULT_BREAKPOINTS: BreakpointDef[] = [
  { id: 'desktop', name: 'Desktop', width: 1440 },
  { id: 'tablet', name: 'Tablet', width: 768 },
  { id: 'mobile', name: 'Mobile', width: 375 },
]

// Common presets offered in the "Add breakpoint" menu (id assigned when added).
export const BREAKPOINT_PRESETS: { name: string; width: number }[] = [
  { name: 'Large', width: 1440 },
  { name: 'Laptop', width: 1024 },
  { name: 'Small mobile', width: 320 },
]

// Infer the device bucket from a width — the thresholds also pick the icon.
export function deviceType(width: number): Breakpoint {
  if (width >= 1024) return 'desktop'
  if (width >= 640) return 'tablet'
  return 'mobile'
}

// Icon-registry key for a breakpoint of the given width (desktop/tablet/mobile).
export function deviceIcon(width: number): string {
  return deviceType(width)
}

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
  { key: 'root', label: 'Page root' },
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

// --- Node defaults & element groups ---

export const nodeDefaults: Partial<Record<NodeType, Partial<Omit<CanvasNode, 'id' | 'type'>>>> = {
  // System
  body: { tag: 'body', label: 'Body', styles: { margin: '0', padding: '0' } },
  component: { tag: 'div', label: 'Component' },
  // Layout
  section: { tag: 'section', label: 'Section' },
  container: { tag: 'div', label: 'Container' },
  div: { tag: 'div', label: 'Div' },
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
  // Data
  'collection-list': { tag: 'div', label: 'Collection List', props: { source: 'posts', limit: '3', orderBy: 'date', order: 'desc' } },
  'collection-item': { tag: 'div', label: 'Collection Item' },
}

// Elements that are containers
export const CONTAINER_TYPES: NodeType[] = ['body', 'container', 'section', 'div', 'form', 'list', 'blockquote', 'component', 'collection-list', 'collection-item']

// Elements that support inline text editing
export const TEXT_EDITABLE_TYPES: NodeType[] = ['text', 'heading', 'button', 'link', 'span', 'label', 'list-item', 'blockquote']

// Content-bearing elements the user edits in "content" mode — typography,
// media, and interactive elements. In content mode only these show selection
// and hover outlines; structural/layout elements stay out of the way.
export const CONTENT_TYPES: NodeType[] = [
  'heading', 'text', 'markdown', 'link', 'span', 'list', 'list-item', 'blockquote',
  'image', 'video',
  'button',
]

// Form elements that require a form parent
export const FORM_CHILD_TYPES: NodeType[] = ['input', 'textarea', 'select', 'checkbox', 'radio', 'file-upload', 'label']

