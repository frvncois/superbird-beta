// Type definitions for the Superbird canvas domain.
// Runtime constants live in @/constants/canvas; factories in @/lib/nodeFactory.

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
  | 'markdown'
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

// --- Styles ---

export type StyleState = 'default' | 'hover' | 'focus' | 'active' | 'visited'

export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

export type StateStyles = Record<StyleState, Record<string, string>>

export interface StyleClass {
  name: string
  styles: Record<Breakpoint, StateStyles>
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

export type TargetType = 'self' | 'children' | 'child' | 'sibling' | 'parent' | 'class' | 'id'

export type ActionProperty =
  | 'opacity'
  | 'translateX' | 'translateY' | 'translateZ'
  | 'scaleX' | 'scaleY'
  | 'rotateX' | 'rotateY' | 'rotateZ'
  | 'width' | 'height'
  | 'background-color' | 'color'
  | 'blur' | 'brightness' | 'contrast' | 'saturate'

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
}

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
  dynamicFields?: DynamicField[]
}

export interface DynamicField {
  key: string
  label: string
  type: 'text' | 'image' | 'richtext' | 'date' | 'list' | 'number' | 'action'
  placeholder?: string
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

// --- Collections ---

export type CollectionSource = 'posts' | 'products' | 'categories' | 'tags' | 'pages'

export interface CollectionSourceConfig {
  key: CollectionSource
  label: string
  fields: DynamicField[]
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
  createdAt: string
}

export interface MediaFolder {
  id: string
  name: string
  parentId?: string
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

export interface SiteIntegrations {
  googleFontsApiKey?: string
  customFonts: { name: string; url: string }[]
  formHandler?: string
  formEmail?: string
}

export interface ImageCompression {
  enabled: boolean
  maxWidth: number
  maxHeight: number
  quality: number // 1–100
}

export interface SiteSettings {
  identity: SiteIdentity
  seo: SeoDefaults
  customCode: CustomCode
  redirects: Redirect[]
  integrations: SiteIntegrations
  imageCompression: ImageCompression
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

export interface GlobalStyles {
  colors: Record<string, string>
  fonts: { primary: string; secondary: string }
  sizes: Record<string, string>
  typography: Record<Breakpoint, TypographySettings>
}
