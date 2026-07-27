// Type definitions for the Superbird canvas domain.
// Runtime constants live in @/constants/canvas; factories in @/lib/nodeFactory.

// User-facing categorization lives in SidebarElements.vue (the palette).
export type NodeType =
  | 'body'
  | 'container'
  | 'section'
  | 'div'
  | 'heading'
  | 'text'
  | 'markdown'
  | 'link'
  | 'span'
  | 'list'
  | 'list-item'
  | 'blockquote'
  | 'image'
  | 'video'
  | 'embed'
  | 'form'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'label'
  | 'file-upload'
  | 'button'
  | 'collection-list'
  | 'collection-item'
  | 'component'

// --- Styles ---

export type StyleState = 'default' | 'hover' | 'focus' | 'active' | 'visited'

// Coarse device buckets — used for responsive typography, element visibility,
// and inferring a breakpoint's device icon from its width.
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

// A breakpoint's stable key in a class's style map: the three seeded device ids
// (`desktop`/`tablet`/`mobile`) plus any user-added custom breakpoints.
export type BreakpointId = string

// A responsive breakpoint in the project's registry — a name + a max-width. Its
// device type (and icon) is inferred from the width (see `deviceType`).
export interface BreakpointDef {
  id: BreakpointId
  name: string
  width: number
}

export type StateStyles = Record<StyleState, Record<string, string>>

export interface StyleClass {
  name: string
  styles: Record<BreakpointId, StateStyles>
}

// --- Node settings ---

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
  // Link to the current entry (in a collection-list item or on a collection
  // template) — resolved per-entry at render time.
  currentEntry?: boolean
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

export type TargetType = 'self' | 'children' | 'child' | 'sibling' | 'parent' | 'class' | 'id' | 'root'

export type ActionProperty =
  | 'opacity'
  | 'translateX' | 'translateY' | 'translateZ'
  | 'scaleX' | 'scaleY'
  | 'rotateX' | 'rotateY' | 'rotateZ'
  | 'width' | 'height'
  | 'background-color' | 'color'
  | 'blur' | 'brightness' | 'contrast' | 'saturate'

// Animate a CSS property from → to (the default / legacy action).
export interface AnimateAction {
  type?: 'animate'
  property: ActionProperty
  from: string
  to: string
}

// Add / remove / toggle a class on the target element.
export type ClassOp = 'add' | 'remove' | 'toggle'
export interface ClassAction {
  type: 'class'
  op: ClassOp
  className: string
}

export type InteractionAction = AnimateAction | ClassAction

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

// --- Nodes ---

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
  // Prebuilt "dynamic" element with a premade action (lang-switcher).
  // The tree is user-editable; the runtime wires the action via data-sb-el.
  element?: PrebuiltElementKey
}

export type PrebuiltElementKey = 'lang-switcher' | 'link'

// --- Locales ---

export interface Locale {
  code: string
  label: string
  flag: string
}

// --- User components ---

export interface UserComponent {
  id: string
  name: string
  tree: CanvasNode
}

// --- Pages ---

export type PageType = 'page' | 'collection' | 'system'

export interface PageTypeConfig {
  key: PageType
  label: string
  plural: string
  allowMultiple: boolean
}

export interface PageSeo {
  title?: string
  description?: string
  socialImage?: string
  noIndex?: boolean
}

export interface Page {
  id: string
  name: string
  slug: string
  pageType: PageType
  status?: 'draft' | 'published'
  seo?: PageSeo
  body: CanvasNode
}

// --- Collections (user-defined content types) ---

// A field's type. A field is a dynamic-field element placed on a collection's
// template; the type is derived from the placed element.
export type FieldType = 'text' | 'richtext' | 'image' | 'number' | 'date'

// Derived by walking a collection template for nodes with `dynamicField` set.
export interface CollectionField {
  key: string
  label: string
  type: FieldType
}

export interface Collection {
  id: string
  name: string
  singular: string
  plural: string
  basePath: string        // URL segment, e.g. "blog"
  status?: 'draft' | 'published'
  templatePageId: string  // the Page (pageType 'collection') this collection edits
}

export interface Entry {
  id: string
  collectionId: string
  title: string
  slug: string
  status: 'draft' | 'published'
  values: Record<string, string>  // keyed by field key (a node's `dynamicField`)
}

// --- Media library ---

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
  // Private media is served only to an authenticated admin — never on the
  // published public site (also cascades from a private parent folder).
  private?: boolean
  createdAt: string
}

export interface MediaFolder {
  id: string
  name: string
  parentId?: string
  private?: boolean
}

// --- Site settings ---

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

// Per-form delivery config, keyed by the form node's id in SiteSettings.forms.
// The server reads this at submit time (the browser can't override it).
export interface FormConfig {
  name?: string
  saveToDb: boolean
  notificationEmail?: string
  webhookUrl?: string
  successMessage?: string
}

export interface ImageCompression {
  enabled: boolean
  maxWidth: number
  maxHeight: number
  quality: number // 1–100
}

// Where the site is deployed. `url` is the canonical public base URL — a custom
// domain (https://example.com) or a host:port (http://localhost:3001). Empty =
// unset: the app falls back to the runtime origin and the server does not
// enforce an origin allowlist.
export interface DeploymentSettings {
  url: string
}

export interface SiteSettings {
  identity: SiteIdentity
  deployment: DeploymentSettings
  seo: SeoDefaults
  customCode: CustomCode
  redirects: Redirect[]
  imageCompression: ImageCompression
  forms: Record<string, FormConfig>
}

// --- Global styles ---

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

// A single weight/style of a font, self-hosted at `url` (served /fonts/:file).
export interface FontFace {
  weight: string // '400', '700', …
  style: 'normal' | 'italic'
  url: string
  format?: string // 'woff2' | 'woff' | 'truetype' | 'opentype'
}

// A font the user added to their project (Google, Fontshare, or uploaded). The
// bytes live on disk; this metadata (incl. self-hosted urls) is part of the
// design document.
export interface FontFamily {
  id: string
  name: string
  source: 'custom'
  faces: FontFace[]
}

export interface GlobalStyles {
  colors: Record<string, string>
  // Named font variables (design tokens) — mirrors `colors`/`sizes`. Value is a
  // CSS font-family stack. `primary` is the conventional body font.
  fonts: Record<string, string>
  sizes: Record<string, string>
  // Fonts added to the project (self-hosted), surfaced in the font-family picker.
  fontSet: FontFamily[]
  typography: Record<Breakpoint, TypographySettings>
  // Responsive breakpoints (styling): the seeded desktop/tablet/mobile plus any
  // user-added custom breakpoints. Ordered/consumed widest→narrowest.
  breakpoints: BreakpointDef[]
}
