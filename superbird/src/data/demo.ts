import type { CanvasNode, Collection, Entry, GlobalStyles, Interaction, NodeType, Page, StyleClass, UserComponent } from '@/types/canvas'
import { createNode } from '@/lib/nodeFactory'
import { generateNodeId, generateInteractionId, generateStepId } from '@/lib/ids'

// Helper to create breakpoint-aware class styles: cls(desktop, tablet, mobile, hover)
function cls(
  desktop: Record<string, string> = {},
  tablet: Record<string, string> = {},
  mobile: Record<string, string> = {},
  hover: Record<string, string> = {},
): StyleClass['styles'] {
  return {
    desktop: { default: desktop, hover, focus: {}, active: {}, visited: {} },
    tablet: { default: tablet, hover: {}, focus: {}, active: {}, visited: {} },
    mobile: { default: mobile, hover: {}, focus: {}, active: {}, visited: {} },
  }
}

// ============================================================================
// Global styles (design tokens: colors / fonts / sizes / typography)
// ============================================================================

export const demoGlobalStyles: GlobalStyles = {
  colors: {
    primary: '#6366f1',
    'primary-dark': '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    text: '#1e293b',
    'text-light': '#64748b',
    'text-muted': '#94a3b8',
    background: '#ffffff',
    'background-alt': '#f8fafc',
    surface: '#f1f5f9',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Playfair Display',
  },
  sizes: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
  },
  typography: {
    desktop: {
      baseFontSize: '16px',
      baseLineHeight: '1.6',
      headings: {
        h1: { fontSize: '56px', fontWeight: '700', lineHeight: '1.1' },
        h2: { fontSize: '40px', fontWeight: '700', lineHeight: '1.2' },
        h3: { fontSize: '28px', fontWeight: '600', lineHeight: '1.3' },
        h4: { fontSize: '22px', fontWeight: '600', lineHeight: '1.4' },
        h5: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
        h6: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5' },
      },
      paragraph: { marginBottom: '16px' },
      link: { color: 'var(--global-primary)', hoverColor: 'var(--global-primary-dark)', decoration: 'none' },
    },
    tablet: {
      baseFontSize: '16px',
      baseLineHeight: '1.6',
      headings: {
        h1: { fontSize: '42px', fontWeight: '700', lineHeight: '1.1' },
        h2: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' },
        h3: { fontSize: '24px', fontWeight: '600', lineHeight: '1.3' },
        h4: { fontSize: '20px', fontWeight: '600', lineHeight: '1.4' },
        h5: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
        h6: { fontSize: '16px', fontWeight: '600', lineHeight: '1.5' },
      },
      paragraph: { marginBottom: '16px' },
      link: { color: 'var(--global-primary)', hoverColor: 'var(--global-primary-dark)', decoration: 'none' },
    },
    mobile: {
      baseFontSize: '15px',
      baseLineHeight: '1.6',
      headings: {
        h1: { fontSize: '32px', fontWeight: '700', lineHeight: '1.2' },
        h2: { fontSize: '26px', fontWeight: '700', lineHeight: '1.2' },
        h3: { fontSize: '22px', fontWeight: '600', lineHeight: '1.3' },
        h4: { fontSize: '18px', fontWeight: '600', lineHeight: '1.4' },
        h5: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4' },
        h6: { fontSize: '15px', fontWeight: '600', lineHeight: '1.5' },
      },
      paragraph: { marginBottom: '12px' },
      link: { color: 'var(--global-primary)', hoverColor: 'var(--global-primary-dark)', decoration: 'none' },
    },
  },
}

// ============================================================================
// Style classes (the CSS utility vocabulary shared across pages)
// ============================================================================

const CLASS_DEFS: Record<string, StyleClass['styles']> = {
  // Layout
  'container': cls({ 'max-width': '1200px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }),
  'container-sm': cls({ 'max-width': '800px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }),
  'flex-row': cls({ display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '16px' }, {}, { 'flex-direction': 'column' }),
  'flex-col': cls({ display: 'flex', 'flex-direction': 'column', gap: '16px' }),
  'flex-between': cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }),
  'grid-2': cls({ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '32px', 'align-items': 'center' }, {}, { 'grid-template-columns': '1fr' }),
  'grid-3': cls({ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '24px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }),
  'grid-4': cls({ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '20px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }),

  // Typography
  'heading-hero': cls({ 'font-size': '56px', 'font-weight': '700', 'line-height': '1.1', color: 'var(--global-text)' }, { 'font-size': '42px' }, { 'font-size': '32px' }),
  'heading-section': cls({ 'font-size': '40px', 'font-weight': '700', 'line-height': '1.2', color: 'var(--global-text)', 'margin-bottom': '16px' }, { 'font-size': '32px' }, { 'font-size': '26px' }),
  'heading-card': cls({ 'font-size': '22px', 'font-weight': '600', 'line-height': '1.3', color: 'var(--global-text)', 'margin-bottom': '8px' }),
  'text-body': cls({ 'font-size': '16px', 'line-height': '1.7', color: 'var(--global-text-light)' }, {}, { 'font-size': '15px' }),
  'text-large': cls({ 'font-size': '20px', 'line-height': '1.6', color: 'var(--global-text-light)', 'max-width': '600px' }, { 'font-size': '18px' }),
  'text-small': cls({ 'font-size': '14px', color: 'var(--global-text-muted)' }),
  'text-center': cls({ 'text-align': 'center' }),
  'label': cls({ 'font-size': '13px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1.5px', color: 'var(--global-primary)' }),
  'text-white': cls({ color: '#ffffff' }),
  'text-white-muted': cls({ color: 'rgba(255,255,255,0.75)' }),

  // Spacing
  'section': cls({ 'padding-top': '96px', 'padding-bottom': '96px' }, { 'padding-top': '64px', 'padding-bottom': '64px' }, { 'padding-top': '48px', 'padding-bottom': '48px' }),
  'section-sm': cls({ 'padding-top': '48px', 'padding-bottom': '48px' }, {}, { 'padding-top': '32px', 'padding-bottom': '32px' }),
  'section-head': cls({ 'max-width': '720px', 'margin-left': 'auto', 'margin-right': 'auto', 'text-align': 'center', 'margin-bottom': '64px' }, {}, { 'margin-bottom': '40px' }),
  'gap-lg': cls({ gap: '32px' }),
  'gap-xl': cls({ gap: '48px' }, {}, { gap: '32px' }),
  'mb-sm': cls({ 'margin-bottom': '8px' }),
  'mb-md': cls({ 'margin-bottom': '16px' }),
  'mb-lg': cls({ 'margin-bottom': '32px' }),
  'mb-xl': cls({ 'margin-bottom': '48px' }),
  'mx-auto': cls({ 'margin-left': 'auto', 'margin-right': 'auto' }),
  'full-width': cls({ width: '100%' }),

  // Buttons
  'btn': cls({ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '15px', 'font-weight': '600', 'border-radius': '12px', cursor: 'pointer', transition: 'all 0.2s ease' }),
  'btn-sm': cls({ 'padding-top': '10px', 'padding-bottom': '10px', 'padding-left': '20px', 'padding-right': '20px', 'font-size': '14px' }),
  'btn-primary': cls({ 'background-color': 'var(--global-primary)', color: '#ffffff', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': 'var(--global-primary-dark)', transform: 'translateY(-1px)' }),
  'btn-outline': cls({ 'background-color': 'transparent', color: 'var(--global-text)', border: '2px solid var(--global-border)', 'padding-top': '12px', 'padding-bottom': '12px', 'padding-left': '24px', 'padding-right': '24px' }, {}, {}, { 'border-color': 'var(--global-primary)', color: 'var(--global-primary)' }),
  'btn-white': cls({ 'background-color': '#ffffff', color: 'var(--global-primary)', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': '#f1f5f9', transform: 'translateY(-1px)' }),

  // Cards
  'card': cls({ 'background-color': '#ffffff', 'border-radius': '16px', border: '1px solid var(--global-border)', padding: '32px', transition: 'all 0.25s ease' }, {}, { padding: '24px' }, { 'border-color': 'var(--global-primary)', transform: 'translateY(-4px)', 'box-shadow': '0 12px 24px rgba(99,102,241,0.1)' }),

  // Navigation
  'nav-header': cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'padding-top': '20px', 'padding-bottom': '20px' }),
  'nav-links': cls({ display: 'flex', 'align-items': 'center', gap: '32px' }, {}, { display: 'none' }),
  'nav-link': cls({ 'font-size': '15px', 'font-weight': '500', color: 'var(--global-text-light)', transition: 'color 0.2s ease', cursor: 'pointer' }, {}, {}, { color: 'var(--global-primary)' }),
  'nav-brand': cls({ 'font-size': '22px', 'font-weight': '800', color: 'var(--global-text)', 'letter-spacing': '-0.5px' }),

  // Hero
  'hero': cls({ 'padding-top': '128px', 'padding-bottom': '96px', 'text-align': 'center' }, { 'padding-top': '80px', 'padding-bottom': '64px' }, { 'padding-top': '56px', 'padding-bottom': '48px' }),
  'page-hero': cls({ 'padding-top': '96px', 'padding-bottom': '48px', 'text-align': 'center' }, { 'padding-top': '72px' }, { 'padding-top': '48px' }),

  // Footer
  'footer': cls({ 'background-color': '#0f172a', color: '#94a3b8', 'padding-top': '64px', 'padding-bottom': '32px' }),
  'footer-grid': cls({ display: 'grid', 'grid-template-columns': '2fr 1fr 1fr 1fr', gap: '48px', 'margin-bottom': '48px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }),
  'footer-heading': cls({ 'font-size': '14px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: '#ffffff', 'margin-bottom': '20px' }),
  'footer-link': cls({ 'font-size': '15px', color: '#94a3b8', 'margin-bottom': '12px', cursor: 'pointer', transition: 'color 0.2s ease' }, {}, {}, { color: '#ffffff' }),
  'footer-bottom': cls({ 'border-top': '1px solid #1e293b', 'padding-top': '24px', display: 'flex', 'justify-content': 'space-between', 'font-size': '14px' }, {}, { 'flex-direction': 'column', gap: '8px', 'text-align': 'center' }),

  // Images
  'img-cover': cls({ width: '100%', height: '220px', 'background-color': 'var(--global-surface)', 'border-radius': '12px' }),
  'img-square': cls({ width: '100%', height: '300px', 'background-color': 'var(--global-surface)', 'border-radius': '14px' }),
  'img-avatar': cls({ width: '48px', height: '48px', 'border-radius': '50%', 'background-color': 'var(--global-surface)' }),
  'img-hero': cls({ width: '100%', height: '420px', 'background-color': 'var(--global-surface)', 'border-radius': '20px' }, {}, { height: '240px', 'border-radius': '12px' }),

  // Badges & misc
  'bg-alt': cls({ 'background-color': 'var(--global-background-alt)' }),
  'badge': cls({ display: 'inline-flex', 'background-color': 'rgba(99,102,241,0.1)', color: 'var(--global-primary)', 'font-size': '13px', 'font-weight': '600', 'padding-top': '4px', 'padding-bottom': '4px', 'padding-left': '12px', 'padding-right': '12px', 'border-radius': '100px' }),
  'price': cls({ 'font-size': '48px', 'font-weight': '700', color: 'var(--global-text)', 'line-height': '1' }),
  'price-period': cls({ 'font-size': '16px', 'font-weight': '400', color: 'var(--global-text-muted)' }),
  'icon-box': cls({ width: '56px', height: '56px', 'border-radius': '14px', 'background-color': 'rgba(99,102,241,0.1)', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'margin-bottom': '20px' }),
  'testimonial-quote': cls({ 'font-size': '18px', 'line-height': '1.7', color: 'var(--global-text)', 'font-style': 'italic', 'margin-bottom': '24px' }),
  'star-rating': cls({ color: 'var(--global-warning)', 'font-size': '16px', 'letter-spacing': '2px', 'margin-bottom': '12px' }),

  // Logos
  'logo-row': cls({ display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'center', gap: '48px', opacity: '0.6' }, {}, { gap: '28px' }),
  'logo-item': cls({ 'font-size': '22px', 'font-weight': '700', color: 'var(--global-text-muted)', 'letter-spacing': '-0.5px' }),

  // Stats
  'stats-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '24px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': 'repeat(2, 1fr)' }),
  'stat': cls({ 'text-align': 'center' }),
  'stat-number': cls({ display: 'block', 'font-size': '48px', 'font-weight': '800', color: 'var(--global-primary)', 'line-height': '1' }, { 'font-size': '40px' }),
  'stat-label': cls({ 'font-size': '14px', color: 'var(--global-text-muted)', 'margin-top': '8px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }),

  // Pricing
  'pricing-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '24px', 'align-items': 'stretch' }, { 'grid-template-columns': '1fr' }, { 'grid-template-columns': '1fr' }),
  'pricing-card': cls({ 'background-color': '#ffffff', border: '1px solid var(--global-border)', 'border-radius': '16px', padding: '32px', display: 'flex', 'flex-direction': 'column', gap: '18px', transition: 'all 0.25s ease' }),
  'pricing-featured': cls({ border: '2px solid var(--global-primary)', 'box-shadow': '0 16px 40px rgba(99,102,241,0.15)' }),
  'price-row': cls({ display: 'flex', 'align-items': 'flex-end', gap: '6px' }),
  'feature-list': cls({ display: 'flex', 'flex-direction': 'column', gap: '10px', 'margin-top': '8px', 'margin-bottom': '8px' }),
  'feature-item': cls({ display: 'flex', 'align-items': 'center', gap: '10px' }),
  'feature-check': cls({ color: 'var(--global-success)', 'font-weight': '700' }),

  // Team
  'team-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '32px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': 'repeat(2, 1fr)' }),
  'team-card': cls({ display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center', gap: '4px' }),
  'team-avatar': cls({ width: '120px', height: '120px', 'border-radius': '50%', 'background-color': 'var(--global-surface)', 'margin-bottom': '12px' }),
  'team-name': cls({ 'font-size': '18px', 'font-weight': '600', color: 'var(--global-text)' }),
  'team-role': cls({ 'font-size': '14px', color: 'var(--global-primary)' }),

  // FAQ
  'faq-list': cls({ 'max-width': '760px', 'margin-left': 'auto', 'margin-right': 'auto' }),
  'faq-item': cls({ 'border-bottom': '1px solid var(--global-border)', 'padding-top': '22px', 'padding-bottom': '22px' }),
  'faq-q': cls({ 'font-size': '18px', 'font-weight': '600', color: 'var(--global-text)', 'margin-bottom': '8px' }),
  'faq-a': cls({ 'font-size': '16px', 'line-height': '1.7', color: 'var(--global-text-light)' }),

  // Forms
  'form-card': cls({ 'background-color': '#ffffff', border: '1px solid var(--global-border)', 'border-radius': '16px', padding: '32px' }),
  'form-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px' }, {}, { 'grid-template-columns': '1fr' }),
  'field': cls({ display: 'flex', 'flex-direction': 'column', gap: '6px', 'margin-bottom': '16px' }),
  'field-label': cls({ 'font-size': '14px', 'font-weight': '500', color: 'var(--global-text)' }),
  'info-item': cls({ display: 'flex', 'flex-direction': 'column', gap: '4px', 'margin-bottom': '20px' }),
  'info-label': cls({ 'font-size': '13px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: 'var(--global-primary)' }),

  // Article
  'cta-card': cls({ 'background-color': 'var(--global-primary)', 'border-radius': '24px', 'padding-top': '72px', 'padding-bottom': '72px', 'padding-left': '32px', 'padding-right': '32px', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center' }, {}, { 'padding-top': '48px', 'padding-bottom': '48px' }),
  'article-body': cls({ 'font-size': '18px', 'line-height': '1.8', color: 'var(--global-text-light)' }),
}

export const demoStyleClasses: Record<string, StyleClass> = Object.fromEntries(
  Object.entries(CLASS_DEFS).map(([name, styles]) => [name, { name, styles }]),
) as Record<string, StyleClass>

// ============================================================================
// Node builders — thin sugar over createNode. Text nodes render `content`
// (their children are ignored by the renderer); containers render children.
// ============================================================================

type NodeOpts = Partial<Omit<CanvasNode, 'id' | 'type'>>

function n(type: NodeType, label: string, opts: NodeOpts = {}): CanvasNode {
  return createNode(type, { ...opts, label })
}

const box = (label: string, classes: string[], children: CanvasNode[], opts: NodeOpts = {}) =>
  n('container', label, { classes, children, ...opts })
const sec = (label: string, classes: string[], children: CanvasNode[], opts: NodeOpts = {}) =>
  n('section', label, { tag: 'section', classes, children, ...opts })
const h = (tag: string, label: string, content: string, classes: string[] = [], opts: NodeOpts = {}) =>
  n('heading', label, { tag, content, classes, ...opts })
const txt = (label: string, content: string, classes: string[] = [], opts: NodeOpts = {}) =>
  n('text', label, { content, classes, ...opts })
const span = (label: string, content: string, classes: string[] = [], opts: NodeOpts = {}) =>
  n('span', label, { content, classes, ...opts })
const btn = (label: string, content: string, classes: string[] = [], opts: NodeOpts = {}) =>
  n('button', label, { content, classes, ...opts })
const img = (label: string, classes: string[] = [], opts: NodeOpts = {}) =>
  n('image', label, { classes, ...opts })
const navlink = (content: string, url: string) =>
  n('link', content, { content, classes: ['nav-link'], link: { url } })
const flink = (content: string) =>
  n('link', content, { content, classes: ['footer-link'] })
const featureItem = (label: string) =>
  box('Feature', ['feature-item'], [span('Check', '✓', ['feature-check']), txt('Label', label, ['text-body'])])
const field = (labelText: string, control: CanvasNode) =>
  box('Field', ['field'], [n('label', 'Label', { tag: 'label', content: labelText, classes: ['field-label'] }), control])
const textInput = (label: string, type: string, placeholder: string) =>
  n('input', label, { tag: 'input', props: { type, placeholder } })

// ============================================================================
// Reusable component master trees
// ============================================================================

const navbarTree = box('Navbar', ['nav-header', 'container'], [
  span('Brand', 'Superbird', ['nav-brand']),
  box('Nav Links', ['nav-links'], [
    navlink('Features', '/features'),
    navlink('Pricing', '/pricing'),
    navlink('Blog', '/blog'),
    navlink('About', '/about'),
  ], { tag: 'nav' }),
  btn('Nav CTA', 'Get Started', ['btn', 'btn-primary', 'btn-sm']),
], { tag: 'header' })

const footerTree = box('Footer', ['footer'], [
  box('Footer Inner', ['container'], [
    box('Footer Grid', ['footer-grid'], [
      box('Brand Col', ['flex-col'], [
        span('Brand', 'Superbird', ['nav-brand', 'text-white']),
        txt('About', 'The visual website builder for WordPress. Design, build, and launch without writing code.', ['text-body'], { styles: { color: '#94a3b8', 'margin-top': '12px', 'max-width': '280px' } }),
      ]),
      box('Product Col', ['flex-col'], [
        txt('Heading', 'Product', ['footer-heading'], { tag: 'h4' }),
        flink('Features'), flink('Pricing'), flink('Templates'), flink('Changelog'),
      ]),
      box('Company Col', ['flex-col'], [
        txt('Heading', 'Company', ['footer-heading'], { tag: 'h4' }),
        flink('About'), flink('Blog'), flink('Careers'), flink('Contact'),
      ]),
      box('Legal Col', ['flex-col'], [
        txt('Heading', 'Legal', ['footer-heading'], { tag: 'h4' }),
        flink('Privacy Policy'), flink('Terms of Service'), flink('Cookie Policy'),
      ]),
    ]),
    box('Footer Bottom', ['footer-bottom'], [
      txt('Copyright', '© 2026 Superbird. All rights reserved.', ['text-small']),
      txt('Social', 'Twitter · GitHub · Discord', ['text-small']),
    ]),
  ]),
])

const featureCardTree = box('Feature Card', ['card'], [
  box('Icon', ['icon-box'], [span('Glyph', '◆', [], { styles: { 'font-size': '22px', color: 'var(--global-primary)' } })]),
  h('h3', 'Title', 'Feature title', ['heading-card']),
  txt('Description', 'A short description of this feature and the value it delivers.', ['text-body']),
])

const testimonialCardTree = box('Testimonial Card', ['card'], [
  txt('Stars', '★★★★★', ['star-rating']),
  txt('Quote', '"Superbird completely changed how our team ships marketing sites."', ['testimonial-quote']),
  box('Author', ['flex-row'], [
    img('Avatar', ['img-avatar']),
    box('Info', ['flex-col'], [
      span('Name', 'Jane Cooper', [], { styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
      txt('Role', 'CEO, Acme Inc.', ['text-small']),
    ], { styles: { gap: '2px' } }),
  ]),
])

const pricingCardTree = box('Pricing Card', ['pricing-card'], [
  txt('Plan', 'Starter', ['label']),
  box('Price Row', ['price-row'], [span('Amount', '$19', ['price']), span('Period', '/mo', ['price-period'])]),
  txt('Blurb', 'Everything to launch your first site.', ['text-small']),
  box('Features', ['feature-list'], [featureItem('1 project'), featureItem('Unlimited pages'), featureItem('Community support')]),
  btn('CTA', 'Choose plan', ['btn', 'btn-outline', 'full-width']),
])

const statTree = box('Stat', ['stat'], [
  span('Number', '10k+', ['stat-number']),
  txt('Label', 'Active users', ['stat-label']),
])

const teamMemberTree = box('Team Member', ['team-card'], [
  img('Avatar', ['team-avatar']),
  span('Name', 'Alex Rivera', ['team-name']),
  txt('Role', 'Co-founder', ['team-role']),
])

const blogCardTree = box('Blog Card', ['card'], [
  img('Thumbnail', ['img-cover'], { styles: { 'margin-bottom': '20px' } }),
  span('Category', 'Design', ['badge', 'mb-sm']),
  h('h3', 'Title', 'How to build a design system', ['heading-card']),
  txt('Excerpt', 'A practical guide to scalable design systems for small teams.', ['text-body']),
  txt('Date', 'July 15, 2026', ['text-small'], { styles: { 'margin-top': '12px' } }),
])

const productCardTree = box('Product Card', ['card'], [
  img('Image', ['img-square'], { styles: { 'margin-bottom': '16px' } }),
  h('h3', 'Title', 'Product name', ['heading-card']),
  box('Row', ['flex-between'], [
    span('Price', '$49', ['price'], { styles: { 'font-size': '24px' } }),
    btn('Buy', 'Add to cart', ['btn', 'btn-primary', 'btn-sm']),
  ]),
])

const ctaBannerTree = sec('CTA', ['section'], [
  box('CTA Inner', ['container'], [
    box('CTA Card', ['cta-card'], [
      h('h2', 'Title', 'Ready to build something great?', ['heading-section', 'text-white']),
      txt('Text', 'Start free — no credit card required.', ['text-large', 'text-white-muted', 'mx-auto', 'mb-lg']),
      box('Buttons', ['flex-row'], [
        btn('Primary', 'Start Building Free', ['btn', 'btn-white']),
        btn('Secondary', 'Book a demo', ['btn', 'btn-outline'], { styles: { color: '#fff', 'border-color': 'rgba(255,255,255,0.35)' } }),
      ], { styles: { 'justify-content': 'center' } }),
    ]),
  ]),
])

export const demoUserComponents: Record<string, UserComponent> = {
  'comp-navbar': { id: 'comp-navbar', name: 'Navbar', tree: navbarTree },
  'comp-footer': { id: 'comp-footer', name: 'Footer', tree: footerTree },
  'comp-feature-card': { id: 'comp-feature-card', name: 'Feature Card', tree: featureCardTree },
  'comp-testimonial': { id: 'comp-testimonial', name: 'Testimonial Card', tree: testimonialCardTree },
  'comp-pricing-card': { id: 'comp-pricing-card', name: 'Pricing Card', tree: pricingCardTree },
  'comp-stat': { id: 'comp-stat', name: 'Stat', tree: statTree },
  'comp-team-member': { id: 'comp-team-member', name: 'Team Member', tree: teamMemberTree },
  'comp-blog-card': { id: 'comp-blog-card', name: 'Blog Card', tree: blogCardTree },
  'comp-product-card': { id: 'comp-product-card', name: 'Product Card', tree: productCardTree },
  'comp-cta-banner': { id: 'comp-cta-banner', name: 'CTA Banner', tree: ctaBannerTree },
}

// Instantiate a component, optionally overriding the instance's content/classes.
function comp(compId: string, label: string, overrides: NodeOpts = {}): CanvasNode {
  const tree = demoUserComponents[compId]!.tree
  return {
    ...(JSON.parse(JSON.stringify(tree)) as CanvasNode),
    id: generateNodeId(),
    type: 'component',
    componentId: compId,
    label,
    ...overrides,
  }
}

// Per-instance content factories (shape must mirror each component's tree)
const featureCardChildren = (glyph: string, title: string, desc: string): CanvasNode[] => [
  box('Icon', ['icon-box'], [span('Glyph', glyph, [], { styles: { 'font-size': '22px', color: 'var(--global-primary)' } })]),
  h('h3', 'Title', title, ['heading-card']),
  txt('Description', desc, ['text-body']),
]
const statChildren = (num: string, label: string): CanvasNode[] => [
  span('Number', num, ['stat-number']),
  txt('Label', label, ['stat-label']),
]
const testimonialChildren = (quote: string, name: string, role: string): CanvasNode[] => [
  txt('Stars', '★★★★★', ['star-rating']),
  txt('Quote', quote, ['testimonial-quote']),
  box('Author', ['flex-row'], [
    img('Avatar', ['img-avatar']),
    box('Info', ['flex-col'], [
      span('Name', name, [], { styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
      txt('Role', role, ['text-small']),
    ], { styles: { gap: '2px' } }),
  ]),
]
const pricingChildren = (plan: string, price: string, blurb: string, feats: string[], featured: boolean): CanvasNode[] => [
  txt('Plan', plan, ['label']),
  box('Price Row', ['price-row'], [span('Amount', price, ['price']), span('Period', '/mo', ['price-period'])]),
  txt('Blurb', blurb, ['text-small']),
  box('Features', ['feature-list'], feats.map(featureItem)),
  btn('CTA', featured ? 'Start free trial' : 'Choose plan', ['btn', featured ? 'btn-primary' : 'btn-outline', 'full-width']),
]
const teamChildren = (name: string, role: string): CanvasNode[] => [
  img('Avatar', ['team-avatar']),
  span('Name', name, ['team-name']),
  txt('Role', role, ['team-role']),
]
const blogCardChildren = (cat: string, title: string, excerpt: string, date: string): CanvasNode[] => [
  img('Thumbnail', ['img-cover'], { styles: { 'margin-bottom': '20px' } }),
  span('Category', cat, ['badge', 'mb-sm']),
  h('h3', 'Title', title, ['heading-card']),
  txt('Excerpt', excerpt, ['text-body']),
  txt('Date', date, ['text-small'], { styles: { 'margin-top': '12px' } }),
]
const productChildren = (title: string, price: string): CanvasNode[] => [
  img('Image', ['img-square'], { styles: { 'margin-bottom': '16px' } }),
  h('h3', 'Title', title, ['heading-card']),
  box('Row', ['flex-between'], [
    span('Price', price, ['price'], { styles: { 'font-size': '24px' } }),
    btn('Buy', 'Add to cart', ['btn', 'btn-primary', 'btn-sm']),
  ]),
]
const faqItem = (q: string, a: string) =>
  box('FAQ', ['faq-item'], [txt('Question', q, ['faq-q']), txt('Answer', a, ['faq-a'])])

// ============================================================================
// Interaction presets (fresh ids per call)
// ============================================================================

function fadeInUp(): Interaction {
  return {
    id: generateInteractionId(), name: 'Fade In Up', trigger: 'scroll-into-view',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '30px', to: '0px' },
    ] }],
    options: {},
  }
}
function heroEntrance(): Interaction {
  return {
    id: generateInteractionId(), name: 'Hero Entrance', trigger: 'page-load',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 800, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '40px', to: '0px' },
    ] }],
    options: {},
  }
}
function staggerChildren(): Interaction {
  return {
    id: generateInteractionId(), name: 'Stagger Children', trigger: 'scroll-into-view',
    steps: [{ id: generateStepId(), target: { type: 'children' }, delay: 0, duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', stagger: 100, actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '20px', to: '0px' },
    ] }],
    options: {},
  }
}

// ============================================================================
// Reusable section builders
// ============================================================================

const sectionHead = (eyebrow: string, title: string, sub?: string) =>
  box('Section Head', ['section-head'], [
    span('Eyebrow', eyebrow, ['label', 'mb-sm']),
    h('h2', 'Title', title, ['heading-section']),
    ...(sub ? [txt('Sub', sub, ['text-large', 'mx-auto'])] : []),
  ])

const featuresGrid = () =>
  box('Features Grid', ['grid-3'], [
    comp('comp-feature-card', 'Visual Editor', { children: featureCardChildren('◆', 'Visual Editor', 'Drag and drop with pixel-perfect precision and real-time preview.') }),
    comp('comp-feature-card', 'Responsive', { children: featureCardChildren('▣', 'Responsive Design', 'Design every breakpoint with per-device controls and live preview.') }),
    comp('comp-feature-card', 'Class System', { children: featureCardChildren('◎', 'Class System', 'Reusable CSS classes — change once, update everywhere.') }),
    comp('comp-feature-card', 'Interactions', { children: featureCardChildren('▶', 'Interactions', 'Scroll, hover, and click animations without a line of code.') }),
    comp('comp-feature-card', 'Components', { children: featureCardChildren('◈', 'Components', 'Build once, reuse everywhere — instances stay in sync.') }),
    comp('comp-feature-card', 'WordPress Native', { children: featureCardChildren('■', 'WordPress Native', 'Ships as a plugin and works with your themes and content.') }),
  ], { interactions: [staggerChildren()] })

const statsSection = () =>
  sec('Stats', ['section'], [
    box('Stats Inner', ['container'], [
      box('Stats Grid', ['stats-grid'], [
        comp('comp-stat', 'Users', { children: statChildren('10k+', 'Active users') }),
        comp('comp-stat', 'Pages', { children: statChildren('2M+', 'Pages published') }),
        comp('comp-stat', 'Uptime', { children: statChildren('99.9%', 'Uptime') }),
        comp('comp-stat', 'Rating', { children: statChildren('4.9/5', 'Average rating') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ])

const pricingGrid = () =>
  box('Pricing Grid', ['pricing-grid'], [
    comp('comp-pricing-card', 'Starter', { children: pricingChildren('Starter', '$19', 'For your first project.', ['1 project', 'Unlimited pages', 'Community support'], false) }),
    comp('comp-pricing-card', 'Pro', { classes: ['pricing-card', 'pricing-featured'], children: pricingChildren('Pro', '$49', 'For growing teams.', ['10 projects', 'Custom code', 'Priority support', 'Team roles'], true) }),
    comp('comp-pricing-card', 'Agency', { children: pricingChildren('Agency', '$99', 'For studios & agencies.', ['Unlimited projects', 'White-label export', 'Dedicated manager'], false) }),
  ])

// ============================================================================
// Pages
// ============================================================================

const page = (id: string, name: string, slug: string, pageType: Page['pageType'], children: CanvasNode[]): Page => ({
  id, name, slug, pageType,
  body: n('body', 'Body', { tag: 'body', children }),
})

const homePage = page('demo-home', 'Home', '/', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['hero'], [
    box('Hero Inner', ['container', 'flex-col', 'text-center'], [
      span('Eyebrow', 'Now in public beta', ['badge', 'mb-md']),
      h('h1', 'Hero Title', 'Design and launch websites without code', ['heading-hero', 'mb-md']),
      txt('Hero Subtitle', 'Superbird brings the precision of Figma and the power of Webflow right into your WordPress dashboard.', ['text-large', 'mx-auto', 'mb-lg']),
      box('CTA Buttons', ['flex-row'], [
        btn('Primary', 'Start Building Free', ['btn', 'btn-primary']),
        btn('Secondary', 'Watch Demo', ['btn', 'btn-outline']),
      ], { styles: { 'justify-content': 'center' } }),
      img('Hero Image', ['img-hero', 'mx-auto'], { styles: { 'margin-top': '48px', 'max-width': '960px' } }),
    ], { styles: { 'align-items': 'center' } }),
  ], { interactions: [heroEntrance()] }),
  sec('Logos', ['section-sm'], [
    box('Logos Inner', ['container'], [
      txt('Label', 'Trusted by teams at', ['text-small', 'text-center', 'mb-lg']),
      box('Logo Row', ['logo-row'], [
        span('Logo', 'Acme', ['logo-item']),
        span('Logo', 'Globex', ['logo-item']),
        span('Logo', 'Umbrella', ['logo-item']),
        span('Logo', 'Initech', ['logo-item']),
        span('Logo', 'Hooli', ['logo-item']),
      ]),
    ]),
  ]),
  sec('Features', ['section', 'bg-alt'], [
    box('Features Inner', ['container'], [
      sectionHead('Features', 'Everything you need to build the web', 'Powerful, familiar tools that make professional web design accessible to everyone.'),
      featuresGrid(),
    ]),
  ]),
  statsSection(),
  sec('Testimonials', ['section', 'bg-alt'], [
    box('Testimonials Inner', ['container'], [
      sectionHead('Testimonials', 'Loved by designers and developers'),
      box('Testimonials Grid', ['grid-3'], [
        comp('comp-testimonial', 'T1', { children: testimonialChildren('"The class system alone is worth switching for. Global changes in seconds."', 'Alex Rivera', 'Lead Designer, StartupXYZ') }),
        comp('comp-testimonial', 'T2', { children: testimonialChildren('"Finally a WordPress builder that thinks like a design tool."', 'Sarah Chen', 'Freelance Developer') }),
        comp('comp-testimonial', 'T3', { children: testimonialChildren('"We cut our build time in half. The interactions are magic."', 'Jordan Lee', 'Agency Owner') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ]),
  sec('Pricing Preview', ['section'], [
    box('Pricing Inner', ['container'], [
      sectionHead('Pricing', 'Simple, transparent pricing'),
      pricingGrid(),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner'),
  comp('comp-footer', 'Footer'),
])

const featuresPage = page('demo-features', 'Features', 'features', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'Features', ['label', 'mb-sm']),
      h('h1', 'Title', 'A complete toolkit for building sites', ['heading-hero', 'mb-md']),
      txt('Sub', 'Everything from a real class system to scroll interactions — in one visual canvas.', ['text-large', 'mx-auto']),
    ]),
  ]),
  sec('Row 1', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      img('Image', ['img-hero']),
      box('Text', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Design', ['label']),
        h('h2', 'Title', 'Pixel-perfect visual editing', ['heading-section']),
        txt('Body', 'Position, size, and style every element with the precision you expect from a design tool, then publish it live.', ['text-body']),
      ]),
    ]),
  ]),
  sec('Row 2', ['section', 'bg-alt'], [
    box('Inner', ['container', 'grid-2'], [
      box('Text', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Reuse', ['label']),
        h('h2', 'Title', 'Components that stay in sync', ['heading-section']),
        txt('Body', 'Turn any element into a reusable component. Edit the master and every instance across your site updates instantly.', ['text-body']),
      ]),
      img('Image', ['img-hero']),
    ]),
  ]),
  sec('Grid', ['section'], [
    box('Inner', ['container'], [
      sectionHead('And more', 'Built for the whole workflow'),
      featuresGrid(),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner'),
  comp('comp-footer', 'Footer'),
])

const pricingPage = page('demo-pricing', 'Pricing', 'pricing', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'Pricing', ['label', 'mb-sm']),
      h('h1', 'Title', 'Pricing that scales with you', ['heading-hero', 'mb-md']),
      txt('Sub', 'Start free. Upgrade when you grow. Cancel anytime.', ['text-large', 'mx-auto']),
    ]),
  ]),
  sec('Plans', ['section'], [box('Inner', ['container'], [pricingGrid()])]),
  sec('FAQ', ['section', 'bg-alt'], [
    box('Inner', ['container'], [
      sectionHead('FAQ', 'Frequently asked questions'),
      box('FAQ List', ['faq-list'], [
        faqItem('Can I try Superbird for free?', 'Yes — the Starter plan is free forever and includes one project with unlimited pages.'),
        faqItem('Do I need to know how to code?', 'No. Superbird is fully visual, though you can drop in custom code whenever you want to.'),
        faqItem('Does it work with my theme?', 'Superbird ships as a WordPress plugin and works alongside your existing themes and content.'),
        faqItem('Can I cancel anytime?', 'Absolutely. Plans are month-to-month with no long-term contract.'),
      ]),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner'),
  comp('comp-footer', 'Footer'),
])

const aboutPage = page('demo-about', 'About', 'about', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      h('h1', 'Title', 'We believe the web should be designed, not coded', ['heading-hero', 'mb-md']),
      txt('Sub', 'Superbird is on a mission to make professional web design accessible to everyone.', ['text-large', 'mx-auto']),
    ]),
  ]),
  sec('Story', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      img('Team Photo', ['img-hero']),
      box('Text', ['flex-col', 'gap-lg'], [
        h('h2', 'Title', 'Started with a simple idea', ['heading-section']),
        txt('P1', 'We were tired of the gap between design tools and the live web. Figma is great for design, but you still need engineers to ship it.', ['text-body']),
        txt('P2', 'So we built a WordPress builder that thinks like a design tool — with real classes, breakpoints, interactions, and components.', ['text-body']),
      ]),
    ]),
  ]),
  statsSection(),
  sec('Team', ['section', 'bg-alt'], [
    box('Inner', ['container'], [
      sectionHead('Team', 'The people behind Superbird'),
      box('Team Grid', ['team-grid'], [
        comp('comp-team-member', 'M1', { children: teamChildren('Alex Rivera', 'Co-founder & CEO') }),
        comp('comp-team-member', 'M2', { children: teamChildren('Sarah Chen', 'Co-founder & CTO') }),
        comp('comp-team-member', 'M3', { children: teamChildren('Marcus Lee', 'Head of Design') }),
        comp('comp-team-member', 'M4', { children: teamChildren('Priya Patel', 'Head of Engineering') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner'),
  comp('comp-footer', 'Footer'),
])

const contactPage = page('demo-contact', 'Contact', 'contact', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Contact', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      box('Info', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Contact', ['label']),
        h('h1', 'Title', 'Get in touch', ['heading-hero']),
        txt('Sub', 'Have a question or want a demo? We usually reply within a day.', ['text-large']),
        box('Email', ['info-item'], [span('Label', 'Email', ['info-label']), txt('Value', 'hello@superbird.app', ['text-body'])]),
        box('Office', ['info-item'], [span('Label', 'Office', ['info-label']), txt('Value', 'Remote-first · Worldwide', ['text-body'])]),
      ]),
      n('form', 'Contact Form', { tag: 'form', classes: ['form-card'], children: [
        box('Name Row', ['form-grid'], [
          field('First name', textInput('First', 'text', 'Jane')),
          field('Last name', textInput('Last', 'text', 'Cooper')),
        ]),
        field('Email', textInput('Email', 'email', 'you@example.com')),
        field('Subject', n('select', 'Subject', { tag: 'select' })),
        field('Message', n('textarea', 'Message', { tag: 'textarea' })),
        box('Consent', ['flex-row'], [
          n('checkbox', 'Consent', { tag: 'input' }),
          txt('Consent Label', 'I agree to be contacted about my request.', ['text-small']),
        ]),
        btn('Submit', 'Send message', ['btn', 'btn-primary', 'full-width'], { styles: { 'margin-top': '8px' } }),
      ] }),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

const productsPage = page('demo-products', 'Products', 'products', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      h('h1', 'Title', 'Templates & themes', ['heading-hero', 'mb-md']),
      txt('Sub', 'Professionally designed starting points, built with Superbird.', ['text-large', 'mx-auto']),
    ]),
  ]),
  sec('Grid', ['section'], [
    box('Inner', ['container'], [
      box('Products Grid', ['grid-4'], [
        comp('comp-product-card', 'P1', { children: productChildren('Starter Kit', '$39') }),
        comp('comp-product-card', 'P2', { children: productChildren('Agency Theme', '$89') }),
        comp('comp-product-card', 'P3', { children: productChildren('Store Theme', '$129') }),
        comp('comp-product-card', 'P4', { children: productChildren('Blog Theme', '$49') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner'),
  comp('comp-footer', 'Footer'),
])

// --- Blog archive (a regular Page listing the Blog collection) ---

const blogArchive = page('demo-blog', 'Blog Archive', 'blog', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero', 'bg-alt'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'Blog', ['label', 'mb-sm']),
      h('h1', 'Title', 'Insights & tutorials', ['heading-hero', 'mb-md']),
      txt('Sub', 'Guides, product updates, and stories from the Superbird team.', ['text-large', 'mx-auto']),
    ]),
  ]),
  sec('Posts', ['section'], [
    box('Inner', ['container'], [
      n('collection-list', 'Blog Posts', {
        classes: ['grid-3'],
        props: { source: 'col-blog', limit: '6', orderBy: 'date', order: 'desc' },
        children: [
          n('collection-item', 'Post Item', { classes: ['card'], children: [
            img('Featured', ['img-cover'], { dynamicField: 'post_featured_image', styles: { 'margin-bottom': '16px' } }),
            span('Category', 'Design', ['badge', 'mb-sm'], { dynamicField: 'post_categories' }),
            h('h3', 'Title', 'Post title', ['heading-card'], { dynamicField: 'post_title' }),
            txt('Excerpt', 'A short summary of the post goes here.', ['text-body'], { dynamicField: 'post_excerpt' }),
            txt('Date', 'Jan 1, 2026', ['text-small'], { dynamicField: 'post_date', styles: { 'margin-top': '12px' } }),
          ] }),
        ],
      }),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

// --- Collection templates (single-item layouts) ---

const blogTemplate = page('demo-single-post', 'Blog', 'blog', 'collection', [
  comp('comp-navbar', 'Navbar'),
  sec('Article', ['section'], [
    box('Inner', ['container-sm'], [
      span('Category', 'Design', ['badge', 'mb-md'], { dynamicField: 'post_categories' }),
      h('h1', 'Post Title', 'How to build a modern design system', ['heading-hero', 'mb-md'], { dynamicField: 'post_title' }),
      box('Meta', ['flex-row', 'mb-lg'], [
        img('Avatar', ['img-avatar'], { dynamicField: 'post_featured_image' }),
        box('Info', ['flex-col'], [
          span('Author', 'John Doe', [], { dynamicField: 'post_author', styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
          txt('Date', 'July 15, 2026', ['text-small'], { dynamicField: 'post_date' }),
        ], { styles: { gap: '2px' } }),
      ]),
      img('Featured', ['img-hero', 'mb-xl'], { dynamicField: 'post_featured_image' }),
      txt('Body', 'The full post content is bound here from the CMS. A design system is a collection of reusable components guided by clear standards.', ['article-body'], { dynamicField: 'post_content' }),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

const productsTemplate = page('demo-single-product', 'Products', 'products', 'collection', [
  comp('comp-navbar', 'Navbar'),
  sec('Product', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      img('Gallery', ['img-hero'], { dynamicField: 'product_gallery' }),
      box('Details', ['flex-col', 'gap-lg'], [
        h('h1', 'Title', 'Premium Theme Bundle', ['heading-hero'], { dynamicField: 'product_title', styles: { 'font-size': '40px' } }),
        box('Price Row', ['price-row'], [
          span('Price', '$99', ['price'], { dynamicField: 'product_price' }),
          span('Period', 'one-time', ['price-period']),
        ]),
        txt('Desc', 'Lifetime access to every premium theme, with updates and support included.', ['text-body'], { dynamicField: 'product_description' }),
        box('Actions', ['flex-row'], [
          btn('Add', 'Add to cart', ['btn', 'btn-primary'], { dynamicField: 'product_add_to_cart' }),
          btn('Wishlist', 'Save for later', ['btn', 'btn-outline']),
        ]),
        txt('SKU', 'SKU: SB-BUNDLE-001', ['text-small'], { dynamicField: 'product_sku' }),
      ]),
    ]),
  ]),
  sec('Related', ['section', 'bg-alt'], [
    box('Inner', ['container'], [
      sectionHead('More', 'You might also like'),
      box('Related Grid', ['grid-4'], [
        comp('comp-product-card', 'R1', { children: productChildren('Starter Kit', '$39') }),
        comp('comp-product-card', 'R2', { children: productChildren('Agency Theme', '$89') }),
        comp('comp-product-card', 'R3', { children: productChildren('Store Theme', '$129') }),
        comp('comp-product-card', 'R4', { children: productChildren('Blog Theme', '$49') }),
      ]),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

const notFoundPage = page('demo-404', '404', '404', 'system', [
  comp('comp-navbar', 'Navbar'),
  sec('404', ['hero'], [
    box('Inner', ['container', 'flex-col', 'text-center'], [
      span('Code', '404', [], { styles: { 'font-size': '120px', 'font-weight': '800', color: 'var(--global-primary)', 'line-height': '1', opacity: '0.2' } }),
      h('h2', 'Title', 'Page not found', ['heading-section']),
      txt('Message', 'Sorry, we could not find the page you were looking for. It may have been moved or deleted.', ['text-large', 'mx-auto', 'mb-lg']),
      btn('Home', 'Go back home', ['btn', 'btn-primary'], { link: { url: '/' } }),
    ], { styles: { 'align-items': 'center' } }),
  ]),
  comp('comp-footer', 'Footer'),
])

const categoriesTemplate = page('demo-category-template', 'Categories', 'category', 'collection', [
  comp('comp-navbar', 'Navbar'),
  sec('Category', ['page-hero', 'bg-alt'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'Category', ['label', 'mb-sm']),
      h('h1', 'Name', 'Category name', ['heading-hero', 'mb-md'], { dynamicField: 'cat_name' }),
      txt('Description', 'A short description of this category.', ['text-large', 'mx-auto'], { dynamicField: 'cat_description' }),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

export const demoPages: Page[] = [
  homePage,
  featuresPage,
  pricingPage,
  aboutPage,
  contactPage,
  productsPage,
  blogArchive,
  notFoundPage,
  // Collection templates (reached via the Collections tab, not the Pages tab)
  blogTemplate,
  productsTemplate,
  categoriesTemplate,
]

// ============================================================================
// Collections & entries (in-app CMS seed)
// ============================================================================

export const demoCollections: Collection[] = [
  { id: 'col-blog', name: 'Blog', singular: 'Post', plural: 'Posts', basePath: 'blog', templatePageId: 'demo-single-post' },
  { id: 'col-products', name: 'Products', singular: 'Product', plural: 'Products', basePath: 'products', templatePageId: 'demo-single-product' },
  { id: 'col-categories', name: 'Categories', singular: 'Category', plural: 'Categories', basePath: 'category', templatePageId: 'demo-category-template' },
]

export const demoEntries: Entry[] = [
  // Blog — fields: post_title, post_categories, post_author, post_date, post_content, post_featured_image
  {
    id: 'entry-blog-1', collectionId: 'col-blog', title: 'How to build a modern design system', slug: 'modern-design-system', status: 'published',
    values: {
      post_title: 'How to build a modern design system',
      post_categories: 'Design',
      post_author: 'Sarah Chen',
      post_date: 'July 15, 2026',
      post_content: 'A design system is a collection of reusable components, guided by clear standards, that can be assembled to build any number of applications.',
      post_featured_image: '',
    },
  },
  {
    id: 'entry-blog-2', collectionId: 'col-blog', title: 'Getting started with interactions', slug: 'getting-started-interactions', status: 'published',
    values: {
      post_title: 'Getting started with interactions',
      post_categories: 'Tutorial',
      post_author: 'Alex Rivera',
      post_date: 'July 10, 2026',
      post_content: 'Create stunning scroll and hover animations without writing a single line of code, right from the canvas.',
      post_featured_image: '',
    },
  },
  {
    id: 'entry-blog-3', collectionId: 'col-blog', title: 'Superbird v2.0 is here', slug: 'superbird-v2', status: 'draft',
    values: {
      post_title: 'Superbird v2.0 is here',
      post_categories: 'News',
      post_author: 'Jordan Lee',
      post_date: 'July 5, 2026',
      post_content: 'We have been working hard to bring you the most powerful visual builder yet. Here is what is new.',
      post_featured_image: '',
    },
  },
  // Products — fields: product_title, product_price, product_description, product_sku, product_gallery, product_add_to_cart
  {
    id: 'entry-product-1', collectionId: 'col-products', title: 'Premium Theme Bundle', slug: 'premium-theme-bundle', status: 'published',
    values: {
      product_title: 'Premium Theme Bundle',
      product_price: '$99',
      product_description: 'Lifetime access to every premium theme, with updates and support included.',
      product_sku: 'SB-BUNDLE-001',
      product_add_to_cart: 'Add to cart',
      product_gallery: '',
    },
  },
  {
    id: 'entry-product-2', collectionId: 'col-products', title: 'Agency Starter Kit', slug: 'agency-starter-kit', status: 'published',
    values: {
      product_title: 'Agency Starter Kit',
      product_price: '$149',
      product_description: 'Everything a studio needs to launch client sites fast — components, templates, and CMS presets.',
      product_sku: 'SB-AGENCY-002',
      product_add_to_cart: 'Add to cart',
      product_gallery: '',
    },
  },
  // Categories — fields: cat_name, cat_description
  {
    id: 'entry-cat-1', collectionId: 'col-categories', title: 'Design', slug: 'design', status: 'published',
    values: { cat_name: 'Design', cat_description: 'Posts about design, UI/UX, and visual creativity.' },
  },
  {
    id: 'entry-cat-2', collectionId: 'col-categories', title: 'Development', slug: 'development', status: 'published',
    values: { cat_name: 'Development', cat_description: 'Posts about building, shipping, and the web platform.' },
  },
]
