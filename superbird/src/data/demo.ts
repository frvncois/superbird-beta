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

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

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
    primary: '"Inter", sans-serif',
    secondary: '"Lora", serif',
  },
  fontSet: [],
  breakpoints: [
    { id: 'desktop', name: 'Desktop', width: 1440 },
    { id: 'tablet', name: 'Tablet', width: 768 },
    { id: 'mobile', name: 'Mobile', width: 375 },
  ],
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
// Style classes — the entire visual vocabulary. Every visual decision lives
// here (or in a node's own Style panel), never as an inline style attribute.
// ============================================================================

const CLASS_DEFS: Record<string, StyleClass['styles']> = {
  // Layout
  'container': cls({ 'max-width': '1200px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }),
  'container-sm': cls({ 'max-width': '820px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }),
  'flex-row': cls({ display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '16px' }, {}, { 'flex-direction': 'column' }),
  'flex-col': cls({ display: 'flex', 'flex-direction': 'column', gap: '16px' }),
  'flex-between': cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }),
  'items-center': cls({ 'align-items': 'center' }),
  'justify-center': cls({ 'justify-content': 'center' }),
  'grid-2': cls({ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '48px', 'align-items': 'center' }, {}, { 'grid-template-columns': '1fr', gap: '32px' }),
  'grid-3': cls({ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '24px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }),

  // Typography
  'heading-hero': cls({ 'font-size': '60px', 'font-weight': '800', 'line-height': '1.05', 'letter-spacing': '-1.5px', color: 'var(--global-text)' }, { 'font-size': '44px' }, { 'font-size': '34px' }),
  'heading-section': cls({ 'font-size': '40px', 'font-weight': '700', 'line-height': '1.15', 'letter-spacing': '-0.5px', color: 'var(--global-text)', 'margin-bottom': '16px' }, { 'font-size': '32px' }, { 'font-size': '26px' }),
  'heading-card': cls({ 'font-size': '22px', 'font-weight': '600', 'line-height': '1.3', color: 'var(--global-text)', 'margin-bottom': '8px' }),
  'text-body': cls({ 'font-size': '16px', 'line-height': '1.7', color: 'var(--global-text-light)' }, {}, { 'font-size': '15px' }),
  'text-large': cls({ 'font-size': '20px', 'line-height': '1.6', color: 'var(--global-text-light)', 'max-width': '600px' }, { 'font-size': '18px' }),
  'text-small': cls({ 'font-size': '14px', color: 'var(--global-text-muted)' }),
  'text-center': cls({ 'text-align': 'center' }),
  'label': cls({ 'font-size': '13px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1.5px', color: 'var(--global-primary)' }),
  'text-white': cls({ color: '#ffffff' }),
  'text-white-muted': cls({ color: 'rgba(255,255,255,0.75)' }),
  'author-name': cls({ 'font-size': '15px', 'font-weight': '600', color: 'var(--global-text)' }),
  'author-info': cls({ display: 'flex', 'flex-direction': 'column', gap: '2px' }),
  'glyph': cls({ 'font-size': '24px', 'line-height': '1', color: 'var(--global-primary)' }),

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
  'mt-md': cls({ 'margin-top': '16px' }),
  'mt-lg': cls({ 'margin-top': '32px' }),
  'mx-auto': cls({ 'margin-left': 'auto', 'margin-right': 'auto' }),
  'full-width': cls({ width: '100%' }),

  // Buttons
  'btn': cls({ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '15px', 'font-weight': '600', 'border-radius': '12px', cursor: 'pointer', 'text-decoration': 'none', transition: 'all 0.2s ease' }),
  'btn-sm': cls({ 'padding-top': '10px', 'padding-bottom': '10px', 'padding-left': '20px', 'padding-right': '20px', 'font-size': '14px' }),
  'btn-primary': cls({ 'background-color': 'var(--global-primary)', color: '#ffffff', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': 'var(--global-primary-dark)' }),
  'btn-outline': cls({ 'background-color': 'transparent', color: 'var(--global-text)', border: '2px solid var(--global-border)', 'padding-top': '12px', 'padding-bottom': '12px', 'padding-left': '24px', 'padding-right': '24px' }, {}, {}, { 'border-color': 'var(--global-primary)', color: 'var(--global-primary)' }),
  'btn-white': cls({ 'background-color': '#ffffff', color: 'var(--global-primary)', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': '#f1f5f9' }),
  'btn-ghost-white': cls({ 'background-color': 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.35)', 'padding-top': '12px', 'padding-bottom': '12px', 'padding-left': '24px', 'padding-right': '24px' }, {}, {}, { 'border-color': '#ffffff' }),

  // Cards — hover border + shadow via Style; the lift comes from an Interaction.
  'card': cls({ 'background-color': '#ffffff', 'border-radius': '16px', border: '1px solid var(--global-border)', padding: '32px', height: '100%', transition: 'border-color 0.25s ease, box-shadow 0.25s ease' }, {}, { padding: '24px' }, { 'border-color': 'var(--global-primary)', 'box-shadow': '0 12px 28px rgba(99,102,241,0.12)' }),

  // Navigation
  'nav-header': cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'padding-top': '20px', 'padding-bottom': '20px' }),
  'nav-links': cls({ display: 'flex', 'align-items': 'center', gap: '32px' }, {}, { display: 'none' }),
  'nav-link': cls({ 'font-size': '15px', 'font-weight': '500', color: 'var(--global-text-light)', 'text-decoration': 'none', transition: 'color 0.2s ease', cursor: 'pointer' }, {}, {}, { color: 'var(--global-primary)' }),
  'nav-brand': cls({ 'font-size': '22px', 'font-weight': '800', color: 'var(--global-text)', 'letter-spacing': '-0.5px' }),

  // Hero
  'hero': cls({ 'padding-top': '128px', 'padding-bottom': '96px', 'text-align': 'center' }, { 'padding-top': '80px', 'padding-bottom': '64px' }, { 'padding-top': '56px', 'padding-bottom': '48px' }),
  'page-hero': cls({ 'padding-top': '112px', 'padding-bottom': '48px', 'text-align': 'center' }, { 'padding-top': '80px' }, { 'padding-top': '56px' }),
  'hero-media': cls({ width: '100%', 'max-width': '960px', height: '460px', 'background-color': 'var(--global-surface)', 'border-radius': '20px', 'margin-top': '48px', 'margin-left': 'auto', 'margin-right': 'auto' }, {}, { height: '240px', 'margin-top': '32px', 'border-radius': '12px' }),

  // Footer
  'footer': cls({ 'background-color': '#0f172a', color: '#94a3b8', 'padding-top': '64px', 'padding-bottom': '32px' }),
  'footer-grid': cls({ display: 'grid', 'grid-template-columns': '2fr 1fr 1fr 1fr', gap: '48px', 'margin-bottom': '48px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }),
  'footer-heading': cls({ 'font-size': '14px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: '#ffffff', 'margin-bottom': '20px' }),
  'footer-link': cls({ 'font-size': '15px', color: '#94a3b8', 'text-decoration': 'none', 'margin-bottom': '12px', cursor: 'pointer', transition: 'color 0.2s ease' }, {}, {}, { color: '#ffffff' }),
  'footer-about': cls({ 'font-size': '15px', 'line-height': '1.7', color: '#94a3b8', 'margin-top': '12px', 'max-width': '280px' }),
  'footer-bottom': cls({ 'border-top': '1px solid #1e293b', 'padding-top': '24px', display: 'flex', 'justify-content': 'space-between', 'font-size': '14px' }, {}, { 'flex-direction': 'column', gap: '8px', 'text-align': 'center' }),

  // Images
  'img-cover': cls({ width: '100%', height: '200px', 'background-color': 'var(--global-surface)', 'border-radius': '12px' }),
  'img-square': cls({ width: '100%', height: '300px', 'background-color': 'var(--global-surface)', 'border-radius': '14px' }),
  'img-avatar': cls({ width: '48px', height: '48px', 'border-radius': '50%', 'background-color': 'var(--global-surface)' }),
  'img-feature': cls({ width: '100%', height: '400px', 'background-color': 'var(--global-surface)', 'border-radius': '20px' }, {}, { height: '260px', 'border-radius': '14px' }),

  // Badges & misc
  'bg-alt': cls({ 'background-color': 'var(--global-background-alt)' }),
  'badge': cls({ display: 'inline-flex', 'align-items': 'center', 'background-color': 'rgba(99,102,241,0.1)', color: 'var(--global-primary)', 'font-size': '13px', 'font-weight': '600', 'padding-top': '4px', 'padding-bottom': '4px', 'padding-left': '12px', 'padding-right': '12px', 'border-radius': '100px' }),
  'icon-box': cls({ width: '56px', height: '56px', 'border-radius': '14px', 'background-color': 'rgba(99,102,241,0.1)', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'margin-bottom': '20px' }),
  'testimonial-quote': cls({ 'font-size': '18px', 'line-height': '1.7', color: 'var(--global-text)', 'font-style': 'italic', 'margin-bottom': '24px' }),
  'star-rating': cls({ color: 'var(--global-warning)', 'font-size': '16px', 'letter-spacing': '2px', 'margin-bottom': '12px' }),
  'error-code': cls({ 'font-size': '140px', 'font-weight': '800', color: 'var(--global-primary)', 'line-height': '1', opacity: '0.15' }, {}, { 'font-size': '96px' }),

  // Logos
  'logo-row': cls({ display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', 'justify-content': 'center', gap: '48px', opacity: '0.6' }, {}, { gap: '28px' }),
  'logo-item': cls({ 'font-size': '22px', 'font-weight': '700', color: 'var(--global-text-muted)', 'letter-spacing': '-0.5px' }),

  // Stats
  'stats-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '24px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': 'repeat(2, 1fr)' }),
  'stat': cls({ 'text-align': 'center' }),
  'stat-number': cls({ display: 'block', 'font-size': '48px', 'font-weight': '800', color: 'var(--global-primary)', 'line-height': '1' }, { 'font-size': '40px' }),
  'stat-label': cls({ 'font-size': '14px', color: 'var(--global-text-muted)', 'margin-top': '8px', 'text-transform': 'uppercase', 'letter-spacing': '0.5px' }),

  // Feature lists / rows
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
  'form-card': cls({ 'background-color': '#ffffff', border: '1px solid var(--global-border)', 'border-radius': '16px', padding: '32px' }, {}, { padding: '24px' }),
  'form-grid': cls({ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px' }, {}, { 'grid-template-columns': '1fr' }),
  'field': cls({ display: 'flex', 'flex-direction': 'column', gap: '6px', 'margin-bottom': '16px' }),
  'field-label': cls({ 'font-size': '14px', 'font-weight': '500', color: 'var(--global-text)' }),
  'input': cls({ width: '100%', 'font-size': '15px', color: 'var(--global-text)', 'background-color': 'var(--global-background)', border: '1px solid var(--global-border)', 'border-radius': '10px', 'padding-top': '11px', 'padding-bottom': '11px', 'padding-left': '14px', 'padding-right': '14px', transition: 'border-color 0.15s ease' }, {}, {}, { 'border-color': 'var(--global-primary)' }),
  'info-item': cls({ display: 'flex', 'flex-direction': 'column', gap: '4px', 'margin-bottom': '20px' }),
  'info-label': cls({ 'font-size': '13px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: 'var(--global-primary)' }),

  // CTA
  'cta-card': cls({ 'background-color': 'var(--global-primary)', 'border-radius': '24px', 'padding-top': '72px', 'padding-bottom': '72px', 'padding-left': '32px', 'padding-right': '32px', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center' }, {}, { 'padding-top': '48px', 'padding-bottom': '48px' }),

  // Documentation (left-sidebar layout)
  'doc-layout': cls({ display: 'grid', 'grid-template-columns': '240px 1fr', gap: '56px', 'align-items': 'start' }, { 'grid-template-columns': '200px 1fr', gap: '32px' }, { 'grid-template-columns': '1fr', gap: '32px' }),
  'doc-sidebar': cls({ display: 'flex', 'flex-direction': 'column', gap: '16px', position: 'sticky', top: '96px' }, {}, { position: 'static', top: 'auto' }),
  'doc-sidebar-title': cls({ 'font-size': '12px', 'font-weight': '700', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: 'var(--global-text-muted)' }),
  'doc-nav': cls({ display: 'flex', 'flex-direction': 'column', gap: '2px', 'border-left': '1px solid var(--global-border)' }),
  'doc-nav-item': cls({ display: 'block' }),
  'doc-nav-link': cls({ display: 'block', 'padding-top': '8px', 'padding-bottom': '8px', 'padding-left': '16px', 'padding-right': '12px', 'font-size': '15px', 'font-weight': '500', 'text-decoration': 'none', color: 'var(--global-text-light)', 'border-left': '2px solid transparent', 'margin-left': '-1px', cursor: 'pointer', transition: 'color 0.15s ease, border-color 0.15s ease' }, {}, {}, { color: 'var(--global-primary)', 'border-left-color': 'var(--global-primary)' }),
  'doc-content': cls({ display: 'flex', 'flex-direction': 'column', gap: '16px', 'min-width': '0', 'max-width': '760px' }),
  'doc-prose': cls({ 'font-size': '17px', 'line-height': '1.8', color: 'var(--global-text-light)' }),

  // Article
  'article-body': cls({ 'font-size': '18px', 'line-height': '1.8', color: 'var(--global-text-light)' }),
}

export const demoStyleClasses: Record<string, StyleClass> = Object.fromEntries(
  Object.entries(CLASS_DEFS).map(([name, styles]) => [name, { name, styles }]),
) as Record<string, StyleClass>

// ============================================================================
// Node builders — thin sugar over createNode. No inline `styles`: every visual
// choice is a class from the vocabulary above.
// ============================================================================

type NodeOpts = Partial<Omit<CanvasNode, 'id' | 'type'>>

function n(type: NodeType, label: string, opts: NodeOpts = {}): CanvasNode {
  return createNode(type, { ...opts, label })
}

const box = (label: string, classes: string[], children: CanvasNode[], opts: NodeOpts = {}) =>
  n('div', label, { classes, children, ...opts })
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
const flink = (content: string, url = '#') =>
  n('link', content, { content, classes: ['footer-link'], link: { url } })
const featureItem = (label: string) =>
  box('Feature', ['feature-item'], [span('Check', '✓', ['feature-check']), txt('Label', label, ['text-body'])])
const field = (labelText: string, control: CanvasNode) =>
  box('Field', ['field'], [n('label', 'Label', { tag: 'label', content: labelText, classes: ['field-label'] }), control])
const textInput = (label: string, type: string, placeholder: string) =>
  n('input', label, { tag: 'input', classes: ['input'], props: { type, placeholder } })

// ============================================================================
// Interaction presets (fresh ids per call so no two nodes share an id)
// ============================================================================

// Page transition — the section slides/fades in the moment the page loads.
function pageEnter(): Interaction {
  return {
    id: generateInteractionId(), name: 'Page Enter', trigger: 'page-load',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 700, easing: EASE, actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '24px', to: '0px' },
    ] }],
    options: {},
  }
}
// Reveal a block as it scrolls into view.
function revealUp(): Interaction {
  return {
    id: generateInteractionId(), name: 'Reveal Up', trigger: 'scroll-into-view',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 650, easing: EASE, actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '32px', to: '0px' },
    ] }],
    options: {},
  }
}
// Reveal each child of a grid, staggered, as the grid scrolls into view.
function staggerChildren(): Interaction {
  return {
    id: generateInteractionId(), name: 'Stagger Children', trigger: 'scroll-into-view',
    steps: [{ id: generateStepId(), target: { type: 'children' }, delay: 0, duration: 550, easing: EASE, stagger: 90, actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '24px', to: '0px' },
    ] }],
    options: {},
  }
}
// Hover — scale up slightly, reverse on leave.
function hoverGrow(): Interaction {
  return {
    id: generateInteractionId(), name: 'Hover Grow', trigger: 'hover',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 300, easing: EASE, actions: [
      { property: 'scaleX', from: '1', to: '1.04' },
      { property: 'scaleY', from: '1', to: '1.04' },
    ] }],
    options: { resetOnExit: true },
  }
}
// Hover — lift up, reverse on leave.
function hoverLift(): Interaction {
  return {
    id: generateInteractionId(), name: 'Hover Lift', trigger: 'hover',
    steps: [{ id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 250, easing: EASE, actions: [
      { property: 'translateY', from: '0px', to: '-8px' },
    ] }],
    options: { resetOnExit: true },
  }
}

// ============================================================================
// Reusable component master trees
// ============================================================================

const navbarTree = box('Navbar', ['nav-header', 'container'], [
  span('Brand', 'Superbird', ['nav-brand']),
  box('Nav Links', ['nav-links'], [
    navlink('Features', '/features'),
    navlink('Docs', '/documentation'),
    navlink('About', '/about'),
    navlink('Support', '/support'),
  ], { tag: 'nav' }),
  btn('Nav CTA', 'Get Started', ['btn', 'btn-primary', 'btn-sm']),
], { tag: 'header' })

const footerTree = box('Footer', ['footer'], [
  box('Footer Inner', ['container'], [
    box('Footer Grid', ['footer-grid'], [
      box('Brand Col', ['flex-col'], [
        span('Brand', 'Superbird', ['nav-brand', 'text-white']),
        txt('About', 'The visual website builder for WordPress. Design, build, and launch without writing code.', ['footer-about']),
      ]),
      box('Product Col', ['flex-col'], [
        txt('Heading', 'Product', ['footer-heading'], { tag: 'h4' }),
        flink('Features', '/features'), flink('Docs', '/documentation'), flink('Changelog'), flink('Roadmap'),
      ]),
      box('Company Col', ['flex-col'], [
        txt('Heading', 'Company', ['footer-heading'], { tag: 'h4' }),
        flink('About', '/about'), flink('Support', '/support'), flink('Careers'), flink('Contact'),
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
  box('Icon', ['icon-box'], [span('Glyph', '◆', ['glyph'])]),
  h('h3', 'Title', 'Feature title', ['heading-card']),
  txt('Description', 'A short description of this feature and the value it delivers.', ['text-body']),
])

const testimonialCardTree = box('Testimonial Card', ['card'], [
  txt('Stars', '★★★★★', ['star-rating']),
  txt('Quote', '"Superbird completely changed how our team ships marketing sites."', ['testimonial-quote']),
  box('Author', ['flex-row'], [
    img('Avatar', ['img-avatar']),
    box('Info', ['author-info'], [
      span('Name', 'Jane Cooper', ['author-name']),
      txt('Role', 'CEO, Acme Inc.', ['text-small']),
    ]),
  ]),
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

const ctaBannerTree = sec('CTA', ['section'], [
  box('CTA Inner', ['container'], [
    box('CTA Card', ['cta-card'], [
      h('h2', 'Title', 'Ready to build something great?', ['heading-section', 'text-white']),
      txt('Text', 'Start free — no credit card required.', ['text-large', 'text-white-muted', 'mx-auto', 'mb-lg']),
      box('Buttons', ['flex-row', 'justify-center'], [
        btn('Primary', 'Start Building Free', ['btn', 'btn-white']),
        btn('Secondary', 'Book a demo', ['btn', 'btn-ghost-white']),
      ]),
    ]),
  ]),
])

export const demoUserComponents: Record<string, UserComponent> = {
  'comp-navbar': { id: 'comp-navbar', name: 'Navbar', tree: navbarTree },
  'comp-footer': { id: 'comp-footer', name: 'Footer', tree: footerTree },
  'comp-feature-card': { id: 'comp-feature-card', name: 'Feature Card', tree: featureCardTree },
  'comp-testimonial': { id: 'comp-testimonial', name: 'Testimonial Card', tree: testimonialCardTree },
  'comp-stat': { id: 'comp-stat', name: 'Stat', tree: statTree },
  'comp-team-member': { id: 'comp-team-member', name: 'Team Member', tree: teamMemberTree },
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

// Per-instance content factories (shape mirrors each component's tree)
const featureCardChildren = (glyph: string, title: string, desc: string): CanvasNode[] => [
  box('Icon', ['icon-box'], [span('Glyph', glyph, ['glyph'])]),
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
    box('Info', ['author-info'], [
      span('Name', name, ['author-name']),
      txt('Role', role, ['text-small']),
    ]),
  ]),
]
const teamChildren = (name: string, role: string): CanvasNode[] => [
  img('Avatar', ['team-avatar']),
  span('Name', name, ['team-name']),
  txt('Role', role, ['team-role']),
]
const faqItem = (q: string, a: string) =>
  box('FAQ', ['faq-item'], [txt('Question', q, ['faq-q']), txt('Answer', a, ['faq-a'])])

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
    comp('comp-feature-card', 'Visual Editor', { children: featureCardChildren('◆', 'Visual Editor', 'Drag and drop with pixel-perfect precision and a real-time preview.') }),
    comp('comp-feature-card', 'Responsive', { children: featureCardChildren('▣', 'Responsive Design', 'Design every breakpoint with per-device controls and live preview.') }),
    comp('comp-feature-card', 'Class System', { children: featureCardChildren('◎', 'Class System', 'Reusable CSS classes — change once, update everywhere.') }),
    comp('comp-feature-card', 'Interactions', { children: featureCardChildren('▶', 'Interactions', 'Scroll, hover, and load animations without a line of code.') }),
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

// Documentation left-sidebar nav — a collection-list of every doc, each row a
// link to that doc's single page ("current entry"). Fresh ids each call.
const docNav = () =>
  box('Docs Sidebar', ['doc-sidebar'], [
    txt('Sidebar Title', 'Documentation', ['doc-sidebar-title']),
    n('collection-list', 'Docs Nav', {
      tag: 'nav', classes: ['doc-nav'],
      props: { source: 'col-docs', limit: '20', orderBy: 'title', order: 'asc' },
      children: [
        n('collection-item', 'Doc Item', { classes: ['doc-nav-item'], children: [
          n('link', 'Doc Link', { content: 'Doc title', classes: ['doc-nav-link'], link: { currentEntry: true }, dynamicField: 'doc_title' }),
        ] }),
      ],
    }),
  ], { tag: 'aside' })

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
    box('Hero Inner', ['container', 'flex-col', 'text-center', 'items-center'], [
      span('Eyebrow', 'Now in public beta', ['badge', 'mb-md']),
      h('h1', 'Hero Title', 'Design and launch websites without code', ['heading-hero', 'mb-md']),
      txt('Hero Subtitle', 'Superbird brings the precision of Figma and the power of Webflow right into your WordPress dashboard.', ['text-large', 'mx-auto', 'mb-lg']),
      box('CTA Buttons', ['flex-row', 'justify-center'], [
        btn('Primary', 'Start Building Free', ['btn', 'btn-primary']),
        btn('Secondary', 'Watch Demo', ['btn', 'btn-outline']),
      ]),
      img('Hero Image', ['hero-media'], { interactions: [hoverGrow()] }),
    ]),
  ], { interactions: [pageEnter()] }),
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
  ], { interactions: [revealUp()] }),
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
  comp('comp-cta-banner', 'CTA Banner', { interactions: [revealUp()] }),
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
  ], { interactions: [pageEnter()] }),
  sec('Row 1', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      img('Image', ['img-feature'], { interactions: [hoverGrow()] }),
      box('Text', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Design', ['label']),
        h('h2', 'Title', 'Pixel-perfect visual editing', ['heading-section']),
        txt('Body', 'Position, size, and style every element with the precision you expect from a design tool, then publish it live.', ['text-body']),
        box('Checklist', ['feature-list'], [
          featureItem('Drag & drop canvas'),
          featureItem('Per-breakpoint controls'),
          featureItem('Real-time preview'),
        ]),
      ]),
    ]),
  ], { interactions: [revealUp()] }),
  sec('Row 2', ['section', 'bg-alt'], [
    box('Inner', ['container', 'grid-2'], [
      box('Text', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Reuse', ['label']),
        h('h2', 'Title', 'Components that stay in sync', ['heading-section']),
        txt('Body', 'Turn any element into a reusable component. Edit the master and every instance across your site updates instantly.', ['text-body']),
      ]),
      img('Image', ['img-feature'], { interactions: [hoverGrow()] }),
    ]),
  ], { interactions: [revealUp()] }),
  sec('Grid', ['section'], [
    box('Inner', ['container'], [
      sectionHead('And more', 'Built for the whole workflow'),
      featuresGrid(),
    ]),
  ]),
  comp('comp-cta-banner', 'CTA Banner', { interactions: [revealUp()] }),
  comp('comp-footer', 'Footer'),
])

// --- Documentation landing (left-sidebar layout + doc collection nav) ---

const documentationPage = page('demo-documentation', 'Documentation', 'documentation', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Docs', ['section'], [
    box('Docs Inner', ['container'], [
      box('Docs Layout', ['doc-layout'], [
        docNav(),
        box('Content', ['doc-content'], [
          span('Eyebrow', 'Guides', ['label', 'mb-sm']),
          h('h1', 'Title', 'Welcome to the Superbird docs', ['heading-section', 'mb-md']),
          txt('Intro', 'Learn how to design, build, and ship websites with Superbird. Pick a topic from the sidebar, or start with the basics below.', ['doc-prose']),
          box('Quick Links', ['flex-col', 'gap-lg', 'mt-lg'], [
            n('link', 'Start', { content: '→ Getting started', classes: ['doc-nav-link'], link: { url: '/docs/getting-started' } }),
            n('link', 'Install', { content: '→ Installing the plugin', classes: ['doc-nav-link'], link: { url: '/docs/installation' } }),
            n('link', 'Elements', { content: '→ Working with elements', classes: ['doc-nav-link'], link: { url: '/docs/elements' } }),
          ]),
        ]),
      ]),
    ]),
  ], { interactions: [pageEnter()] }),
  comp('comp-footer', 'Footer'),
])

// --- Documentation single template (collection: col-docs, base /docs) ---

const docTemplate = page('demo-doc', 'Doc', 'docs', 'collection', [
  comp('comp-navbar', 'Navbar'),
  sec('Docs', ['section'], [
    box('Docs Inner', ['container'], [
      box('Docs Layout', ['doc-layout'], [
        docNav(),
        box('Content', ['doc-content'], [
          span('Category', 'Guide', ['badge', 'mb-sm'], { dynamicField: 'doc_category' }),
          h('h1', 'Doc Title', 'Getting started', ['heading-section', 'mb-md'], { dynamicField: 'doc_title' }),
          txt('Doc Body', 'The full documentation content is bound here from the collection.', ['doc-prose'], { dynamicField: 'doc_content' }),
        ], { interactions: [revealUp()] }),
      ]),
    ]),
  ]),
  comp('comp-footer', 'Footer'),
])

const aboutPage = page('demo-about', 'About', 'about', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'About', ['label', 'mb-sm']),
      h('h1', 'Title', 'We believe the web should be designed, not coded', ['heading-hero', 'mb-md']),
      txt('Sub', 'Superbird is on a mission to make professional web design accessible to everyone.', ['text-large', 'mx-auto']),
    ]),
  ], { interactions: [pageEnter()] }),
  sec('Story', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      img('Team Photo', ['img-feature'], { interactions: [hoverLift()] }),
      box('Text', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Our story', ['label']),
        h('h2', 'Title', 'Started with a simple idea', ['heading-section']),
        txt('P1', 'We were tired of the gap between design tools and the live web. Figma is great for design, but you still need engineers to ship it.', ['text-body']),
        txt('P2', 'So we built a WordPress builder that thinks like a design tool — with real classes, breakpoints, interactions, and components.', ['text-body']),
      ]),
    ]),
  ], { interactions: [revealUp()] }),
  statsSection(),
  sec('Values', ['section', 'bg-alt'], [
    box('Inner', ['container'], [
      sectionHead('Values', 'What we stand for'),
      box('Values Grid', ['grid-3'], [
        comp('comp-feature-card', 'Craft', { children: featureCardChildren('◆', 'Craft', 'Details matter. We sweat the pixels so your sites look flawless.') }),
        comp('comp-feature-card', 'Openness', { children: featureCardChildren('◎', 'Openness', 'Built on WordPress and the open web — no lock-in, ever.') }),
        comp('comp-feature-card', 'Speed', { children: featureCardChildren('▶', 'Speed', 'From idea to live site in minutes, not weeks.') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ]),
  sec('Team', ['section'], [
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
  comp('comp-cta-banner', 'CTA Banner', { interactions: [revealUp()] }),
  comp('comp-footer', 'Footer'),
])

const supportPage = page('demo-support', 'Support', 'support', 'page', [
  comp('comp-navbar', 'Navbar'),
  sec('Hero', ['page-hero'], [
    box('Inner', ['container-sm'], [
      span('Eyebrow', 'Support', ['label', 'mb-sm']),
      h('h1', 'Title', 'How can we help?', ['heading-hero', 'mb-md']),
      txt('Sub', 'Browse the docs, ask the community, or reach out to our team directly.', ['text-large', 'mx-auto']),
    ]),
  ], { interactions: [pageEnter()] }),
  sec('Channels', ['section'], [
    box('Inner', ['container'], [
      box('Channels Grid', ['grid-3'], [
        comp('comp-feature-card', 'Docs', { children: featureCardChildren('◆', 'Documentation', 'Guides and references for every feature. Start here.') }),
        comp('comp-feature-card', 'Community', { children: featureCardChildren('◈', 'Community', 'Join thousands of builders on our Discord server.') }),
        comp('comp-feature-card', 'Email', { children: featureCardChildren('■', 'Email us', 'Reach the team directly — we usually reply within a day.') }),
      ], { interactions: [staggerChildren()] }),
    ]),
  ]),
  sec('FAQ', ['section', 'bg-alt'], [
    box('Inner', ['container'], [
      sectionHead('FAQ', 'Frequently asked questions'),
      box('FAQ List', ['faq-list'], [
        faqItem('Is Superbird free to try?', 'Yes — the Starter plan is free forever and includes one project with unlimited pages.'),
        faqItem('Do I need to know how to code?', 'No. Superbird is fully visual, though you can drop in custom code whenever you want to.'),
        faqItem('Does it work with my theme?', 'Superbird ships as a WordPress plugin and works alongside your existing themes and content.'),
        faqItem('How do I get support?', 'Check the docs first, then reach us via the community Discord or the contact form below.'),
      ]),
    ]),
  ], { interactions: [revealUp()] }),
  sec('Contact', ['section'], [
    box('Inner', ['container', 'grid-2'], [
      box('Info', ['flex-col', 'gap-lg'], [
        span('Eyebrow', 'Contact', ['label']),
        h('h2', 'Title', 'Still stuck? Send us a message', ['heading-section']),
        txt('Sub', 'Tell us what you are trying to do and we will point you in the right direction.', ['text-large']),
        box('Email', ['info-item'], [span('Label', 'Email', ['info-label']), txt('Value', 'support@superbird.app', ['text-body'])]),
        box('Hours', ['info-item'], [span('Label', 'Hours', ['info-label']), txt('Value', 'Mon–Fri · 9am–6pm', ['text-body'])]),
      ]),
      n('form', 'Support Form', { tag: 'form', classes: ['form-card'], children: [
        box('Name Row', ['form-grid'], [
          field('First name', textInput('First', 'text', 'Jane')),
          field('Last name', textInput('Last', 'text', 'Cooper')),
        ]),
        field('Email', textInput('Email', 'email', 'you@example.com')),
        field('Topic', n('select', 'Topic', { tag: 'select', classes: ['input'] })),
        field('Message', n('textarea', 'Message', { tag: 'textarea', classes: ['input'], props: { placeholder: 'How can we help?' } })),
        btn('Submit', 'Send message', ['btn', 'btn-primary', 'full-width', 'mt-md']),
      ] }),
    ]),
  ], { interactions: [revealUp()] }),
  comp('comp-footer', 'Footer'),
])

const notFoundPage = page('demo-404', '404', '404', 'system', [
  comp('comp-navbar', 'Navbar'),
  sec('404', ['hero'], [
    box('Inner', ['container', 'flex-col', 'text-center', 'items-center'], [
      span('Code', '404', ['error-code']),
      h('h2', 'Title', 'Page not found', ['heading-section']),
      txt('Message', 'Sorry, we could not find the page you were looking for. It may have been moved or deleted.', ['text-large', 'mx-auto', 'mb-lg']),
      btn('Home', 'Go back home', ['btn', 'btn-primary'], { link: { url: '/' } }),
    ]),
  ], { interactions: [pageEnter()] }),
  comp('comp-footer', 'Footer'),
])

export const demoPages: Page[] = [
  homePage,
  featuresPage,
  documentationPage,
  aboutPage,
  supportPage,
  notFoundPage,
  // Collection templates (reached via the Collections tab, not the Pages tab)
  docTemplate,
]

// ============================================================================
// Collections & entries (in-app CMS seed) — the documentation topics
// ============================================================================

export const demoCollections: Collection[] = [
  { id: 'col-docs', name: 'Documentation', singular: 'Doc', plural: 'Docs', basePath: 'docs', templatePageId: 'demo-doc' },
]

const doc = (id: string, title: string, slug: string, category: string, content: string): Entry => ({
  id, collectionId: 'col-docs', title, slug, status: 'published',
  values: { doc_title: title, doc_category: category, doc_content: content },
})

export const demoEntries: Entry[] = [
  doc('entry-doc-1', 'Getting started', 'getting-started', 'Basics', 'Superbird is a visual website builder for WordPress. This guide walks you through creating your first page, adding elements, and publishing your site.'),
  doc('entry-doc-2', 'Installing the plugin', 'installation', 'Basics', 'Install Superbird from the WordPress plugin directory, activate it, and open the editor from your dashboard. No configuration required to get started.'),
  doc('entry-doc-3', 'Working with elements', 'elements', 'Building', 'Elements are the building blocks of every page. Drag them from the Elements panel onto the canvas — sections, containers, text, images, forms, and more.'),
  doc('entry-doc-4', 'Styling with classes', 'styling', 'Building', 'The class system lets you define reusable styles once and apply them everywhere. Change a class and every element using it updates instantly across your site.'),
  doc('entry-doc-5', 'Adding interactions', 'interactions', 'Building', 'Bring your pages to life with scroll reveals, hover effects, and load animations — all configured visually in the Interactions panel, no code needed.'),
  doc('entry-doc-6', 'Publishing your site', 'publishing', 'Launch', 'When you are ready, hit Publish to push your design live. Superbird generates clean, fast HTML and CSS served straight from WordPress.'),
]
