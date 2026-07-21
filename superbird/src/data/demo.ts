import type { CanvasNode, GlobalStyles, Interaction, NodeType, Page, StyleClass, UserComponent } from '@/types/canvas'
import { createNode } from '@/lib/nodeFactory'
import { generateNodeId, generateInteractionId, generateStepId } from '@/lib/ids'

// Helper to create breakpoint-aware class styles
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

// --- Global Styles ---

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

// --- Style Classes ---

export const demoStyleClasses: Record<string, StyleClass> = {
  'container': { name: 'container', styles: cls({ 'max-width': '1200px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }) },
  'container-sm': { name: 'container-sm', styles: cls({ 'max-width': '800px', 'margin-left': 'auto', 'margin-right': 'auto', 'padding-left': '24px', 'padding-right': '24px' }) },
  'flex-row': { name: 'flex-row', styles: cls({ display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '16px' }, {}, { 'flex-direction': 'column' }) },
  'flex-col': { name: 'flex-col', styles: cls({ display: 'flex', 'flex-direction': 'column', gap: '16px' }) },
  'flex-between': { name: 'flex-between', styles: cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }) },
  'grid-3': { name: 'grid-3', styles: cls({ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '24px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }) },
  'grid-4': { name: 'grid-4', styles: cls({ display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '20px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }) },
  'grid-2': { name: 'grid-2', styles: cls({ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '32px', 'align-items': 'center' }, {}, { 'grid-template-columns': '1fr' }) },

  // Typography
  'heading-hero': { name: 'heading-hero', styles: cls({ 'font-size': '56px', 'font-weight': '700', 'line-height': '1.1', color: 'var(--global-text)' }, { 'font-size': '42px' }, { 'font-size': '32px' }) },
  'heading-section': { name: 'heading-section', styles: cls({ 'font-size': '40px', 'font-weight': '700', 'line-height': '1.2', color: 'var(--global-text)', 'margin-bottom': '16px' }, { 'font-size': '32px' }, { 'font-size': '26px' }) },
  'heading-card': { name: 'heading-card', styles: cls({ 'font-size': '22px', 'font-weight': '600', 'line-height': '1.3', color: 'var(--global-text)', 'margin-bottom': '8px' }) },
  'text-body': { name: 'text-body', styles: cls({ 'font-size': '16px', 'line-height': '1.7', color: 'var(--global-text-light)' }, {}, { 'font-size': '15px' }) },
  'text-large': { name: 'text-large', styles: cls({ 'font-size': '20px', 'line-height': '1.6', color: 'var(--global-text-light)', 'max-width': '600px' }, { 'font-size': '18px' }) },
  'text-small': { name: 'text-small', styles: cls({ 'font-size': '14px', color: 'var(--global-text-muted)' }) },
  'text-center': { name: 'text-center', styles: cls({ 'text-align': 'center' }) },
  'label': { name: 'label', styles: cls({ 'font-size': '13px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1.5px', color: 'var(--global-primary)' }) },
  'text-white': { name: 'text-white', styles: cls({ color: '#ffffff' }) },
  'text-white-muted': { name: 'text-white-muted', styles: cls({ color: 'rgba(255,255,255,0.7)' }) },

  // Spacing
  'section': { name: 'section', styles: cls({ 'padding-top': '96px', 'padding-bottom': '96px' }, { 'padding-top': '64px', 'padding-bottom': '64px' }, { 'padding-top': '48px', 'padding-bottom': '48px' }) },
  'section-sm': { name: 'section-sm', styles: cls({ 'padding-top': '48px', 'padding-bottom': '48px' }, {}, { 'padding-top': '32px', 'padding-bottom': '32px' }) },
  'gap-lg': { name: 'gap-lg', styles: cls({ gap: '32px' }) },
  'gap-xl': { name: 'gap-xl', styles: cls({ gap: '48px' }, {}, { gap: '32px' }) },
  'mb-sm': { name: 'mb-sm', styles: cls({ 'margin-bottom': '8px' }) },
  'mb-md': { name: 'mb-md', styles: cls({ 'margin-bottom': '16px' }) },
  'mb-lg': { name: 'mb-lg', styles: cls({ 'margin-bottom': '32px' }) },
  'mb-xl': { name: 'mb-xl', styles: cls({ 'margin-bottom': '48px' }) },
  'mx-auto': { name: 'mx-auto', styles: cls({ 'margin-left': 'auto', 'margin-right': 'auto' }) },

  // Buttons
  'btn': { name: 'btn', styles: cls({ display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '15px', 'font-weight': '600', 'border-radius': '12px', cursor: 'pointer', transition: 'all 0.2s ease' }) },
  'btn-primary': { name: 'btn-primary', styles: cls({ 'background-color': 'var(--global-primary)', color: '#ffffff', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': 'var(--global-primary-dark)', transform: 'translateY(-1px)' }) },
  'btn-outline': { name: 'btn-outline', styles: cls({ 'background-color': 'transparent', color: 'var(--global-text)', border: '2px solid var(--global-border)', 'padding-top': '12px', 'padding-bottom': '12px', 'padding-left': '24px', 'padding-right': '24px' }, {}, {}, { 'border-color': 'var(--global-primary)', color: 'var(--global-primary)' }) },
  'btn-white': { name: 'btn-white', styles: cls({ 'background-color': '#ffffff', color: 'var(--global-primary)', 'padding-top': '14px', 'padding-bottom': '14px', 'padding-left': '28px', 'padding-right': '28px' }, {}, {}, { 'background-color': '#f1f5f9', transform: 'translateY(-1px)' }) },

  // Cards
  'card': { name: 'card', styles: cls({ 'background-color': '#ffffff', 'border-radius': '16px', border: '1px solid var(--global-border)', padding: '32px', transition: 'all 0.25s ease' }, {}, { padding: '24px' }, { 'border-color': 'var(--global-primary)', transform: 'translateY(-4px)', 'box-shadow': '0 12px 24px rgba(99,102,241,0.1)' }) },
  'card-dark': { name: 'card-dark', styles: cls({ 'background-color': '#1e293b', 'border-radius': '16px', padding: '32px', color: '#ffffff' }) },
  'card-image': { name: 'card-image', styles: cls({ 'border-radius': '12px', overflow: 'hidden', 'margin-bottom': '20px' }) },

  // Navigation
  'nav-header': { name: 'nav-header', styles: cls({ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'padding-top': '20px', 'padding-bottom': '20px' }) },
  'nav-links': { name: 'nav-links', styles: cls({ display: 'flex', 'align-items': 'center', gap: '32px' }, {}, { display: 'none' }) },
  'nav-link': { name: 'nav-link', styles: cls({ 'font-size': '15px', 'font-weight': '500', color: 'var(--global-text-light)', transition: 'color 0.2s ease', cursor: 'pointer' }, {}, {}, { color: 'var(--global-primary)' }) },
  'nav-brand': { name: 'nav-brand', styles: cls({ 'font-size': '22px', 'font-weight': '800', color: 'var(--global-text)', 'letter-spacing': '-0.5px' }) },

  // Hero
  'hero': { name: 'hero', styles: cls({ 'padding-top': '128px', 'padding-bottom': '128px', 'text-align': 'center' }, { 'padding-top': '80px', 'padding-bottom': '80px' }, { 'padding-top': '56px', 'padding-bottom': '56px' }) },
  'hero-dark': { name: 'hero-dark', styles: cls({ 'background-color': '#0f172a', color: '#ffffff', 'padding-top': '128px', 'padding-bottom': '128px', 'text-align': 'center' }, { 'padding-top': '80px', 'padding-bottom': '80px' }) },

  // Footer
  'footer': { name: 'footer', styles: cls({ 'background-color': '#0f172a', color: '#94a3b8', 'padding-top': '64px', 'padding-bottom': '32px' }) },
  'footer-grid': { name: 'footer-grid', styles: cls({ display: 'grid', 'grid-template-columns': '2fr 1fr 1fr 1fr', gap: '48px', 'margin-bottom': '48px' }, { 'grid-template-columns': 'repeat(2, 1fr)' }, { 'grid-template-columns': '1fr' }) },
  'footer-heading': { name: 'footer-heading', styles: cls({ 'font-size': '14px', 'font-weight': '600', 'text-transform': 'uppercase', 'letter-spacing': '1px', color: '#ffffff', 'margin-bottom': '20px' }) },
  'footer-link': { name: 'footer-link', styles: cls({ 'font-size': '15px', color: '#94a3b8', 'margin-bottom': '12px', cursor: 'pointer', transition: 'color 0.2s ease' }, {}, {}, { color: '#ffffff' }) },
  'footer-bottom': { name: 'footer-bottom', styles: cls({ 'border-top': '1px solid #1e293b', 'padding-top': '24px', display: 'flex', 'justify-content': 'space-between', 'font-size': '14px' }) },

  // Images
  'img-rounded': { name: 'img-rounded', styles: cls({ 'border-radius': '16px', overflow: 'hidden' }) },
  'img-cover': { name: 'img-cover', styles: cls({ width: '100%', height: '240px', 'background-color': 'var(--global-surface)', 'border-radius': '12px' }) },
  'img-avatar': { name: 'img-avatar', styles: cls({ width: '48px', height: '48px', 'border-radius': '50%', 'background-color': 'var(--global-surface)' }) },
  'img-hero': { name: 'img-hero', styles: cls({ width: '100%', height: '400px', 'background-color': 'var(--global-surface)', 'border-radius': '20px' }, {}, { height: '240px', 'border-radius': '12px' }) },

  // Misc
  'bg-alt': { name: 'bg-alt', styles: cls({ 'background-color': 'var(--global-background-alt)' }) },
  'bg-dark': { name: 'bg-dark', styles: cls({ 'background-color': '#0f172a' }) },
  'badge': { name: 'badge', styles: cls({ display: 'inline-flex', 'background-color': 'rgba(99,102,241,0.1)', color: 'var(--global-primary)', 'font-size': '13px', 'font-weight': '600', 'padding-top': '4px', 'padding-bottom': '4px', 'padding-left': '12px', 'padding-right': '12px', 'border-radius': '100px' }) },
  'divider': { name: 'divider', styles: cls({ height: '1px', 'background-color': 'var(--global-border)', width: '100%' }) },
  'price': { name: 'price', styles: cls({ 'font-size': '48px', 'font-weight': '700', color: 'var(--global-text)', 'line-height': '1' }) },
  'price-period': { name: 'price-period', styles: cls({ 'font-size': '16px', 'font-weight': '400', color: 'var(--global-text-muted)' }) },
  'icon-box': { name: 'icon-box', styles: cls({ width: '56px', height: '56px', 'border-radius': '14px', 'background-color': 'rgba(99,102,241,0.1)', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'margin-bottom': '20px' }) },
  'testimonial-quote': { name: 'testimonial-quote', styles: cls({ 'font-size': '18px', 'line-height': '1.7', color: 'var(--global-text)', 'font-style': 'italic', 'margin-bottom': '24px' }) },
  'star-rating': { name: 'star-rating', styles: cls({ color: 'var(--global-warning)', 'font-size': '16px', 'margin-bottom': '12px' }) },
  'full-width': { name: 'full-width', styles: cls({ width: '100%' }) },
}

// --- Helper to create nodes ---

function n(type: NodeType, label: string, opts: Partial<Omit<CanvasNode, 'id' | 'type'>> = {}): CanvasNode {
  return createNode(type, { ...opts, label })
}

// --- User Components ---

const headerTree = n('container', 'Header', {
  tag: 'header',
  classes: ['nav-header', 'container'],
  children: [
    n('text', 'Brand', { tag: 'span', content: 'Superbird', classes: ['nav-brand'] }),
    n('container', 'Nav Links', { tag: 'nav', classes: ['nav-links'], children: [
      n('text', 'Home', { tag: 'a', content: 'Home', classes: ['nav-link'], link: { url: '/' } }),
      n('text', 'About', { tag: 'a', content: 'About', classes: ['nav-link'], link: { url: '/about' } }),
      n('text', 'Blog', { tag: 'a', content: 'Blog', classes: ['nav-link'], link: { url: '/blog' } }),
      n('text', 'Products', { tag: 'a', content: 'Products', classes: ['nav-link'], link: { url: '/products' } }),
      n('text', 'Contact', { tag: 'a', content: 'Contact', classes: ['nav-link'], link: { url: '/contact' } }),
    ]}),
    n('button', 'CTA', { content: 'Get Started', classes: ['btn', 'btn-primary'] }),
  ],
})

const footerTree = n('container', 'Footer', {
  tag: 'footer',
  classes: ['footer'],
  children: [
    n('container', 'Footer Inner', { classes: ['container'], children: [
      n('container', 'Footer Grid', { classes: ['footer-grid'], children: [
        n('container', 'About Col', { classes: ['flex-col'], children: [
          n('text', 'Brand', { tag: 'span', content: 'Superbird', classes: ['nav-brand', 'text-white'] }),
          n('text', 'Description', { content: 'Building the future of web design. A powerful page builder that combines the best of Figma and Webflow.', classes: ['text-body'], styles: { color: '#94a3b8', 'margin-top': '12px' } }),
        ]}),
        n('container', 'Product Col', { classes: ['flex-col'], children: [
          n('text', 'Product', { tag: 'h4', content: 'Product', classes: ['footer-heading'] }),
          n('text', 'Features', { content: 'Features', classes: ['footer-link'] }),
          n('text', 'Pricing', { content: 'Pricing', classes: ['footer-link'] }),
          n('text', 'Templates', { content: 'Templates', classes: ['footer-link'] }),
          n('text', 'Integrations', { content: 'Integrations', classes: ['footer-link'] }),
        ]}),
        n('container', 'Company Col', { classes: ['flex-col'], children: [
          n('text', 'Company', { tag: 'h4', content: 'Company', classes: ['footer-heading'] }),
          n('text', 'About', { content: 'About', classes: ['footer-link'] }),
          n('text', 'Blog', { content: 'Blog', classes: ['footer-link'] }),
          n('text', 'Careers', { content: 'Careers', classes: ['footer-link'] }),
          n('text', 'Contact', { content: 'Contact', classes: ['footer-link'] }),
        ]}),
        n('container', 'Legal Col', { classes: ['flex-col'], children: [
          n('text', 'Legal', { tag: 'h4', content: 'Legal', classes: ['footer-heading'] }),
          n('text', 'Privacy', { content: 'Privacy Policy', classes: ['footer-link'] }),
          n('text', 'Terms', { content: 'Terms of Service', classes: ['footer-link'] }),
          n('text', 'Cookies', { content: 'Cookie Policy', classes: ['footer-link'] }),
        ]}),
      ]}),
      n('container', 'Footer Bottom', { classes: ['footer-bottom'], children: [
        n('text', 'Copyright', { content: '2026 Superbird. All rights reserved.', classes: ['text-small'] }),
        n('text', 'Social', { content: 'Twitter  ·  GitHub  ·  Discord', classes: ['text-small'] }),
      ]}),
    ]}),
  ],
})

const featureCardTree = n('container', 'Feature Card', {
  classes: ['card'],
  children: [
    n('container', 'Icon', { classes: ['icon-box'], children: [
      n('text', 'Icon Emoji', { content: '~', styles: { 'font-size': '24px' } }),
    ]}),
    n('heading', 'Title', { tag: 'h3', content: 'Feature Title', classes: ['heading-card'] }),
    n('text', 'Description', { content: 'A short description of this amazing feature and how it helps users build better websites.', classes: ['text-body'] }),
  ],
})

const testimonialCardTree = n('container', 'Testimonial Card', {
  classes: ['card'],
  children: [
    n('text', 'Stars', { content: '* * * * *', classes: ['star-rating'] }),
    n('text', 'Quote', { content: '"This tool completely transformed how we build websites. The drag-and-drop interface is incredibly intuitive."', classes: ['testimonial-quote'] }),
    n('container', 'Author', { classes: ['flex-row'], children: [
      n('image', 'Avatar', { classes: ['img-avatar'] }),
      n('container', 'Info', { classes: ['flex-col'], styles: { gap: '2px' }, children: [
        n('text', 'Name', { content: 'Jane Smith', styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
        n('text', 'Role', { content: 'CEO at TechCorp', classes: ['text-small'] }),
      ]}),
    ]}),
  ],
})

const blogCardTree = n('container', 'Blog Card', {
  classes: ['card'],
  styles: { padding: '0', overflow: 'hidden' },
  children: [
    n('image', 'Thumbnail', { classes: ['img-cover'], styles: { 'border-radius': '0' } }),
    n('container', 'Content', { styles: { padding: '24px' }, children: [
      n('text', 'Category', { content: 'Design', classes: ['badge', 'mb-sm'] }),
      n('heading', 'Title', { tag: 'h3', content: 'How to Build a Design System', classes: ['heading-card'] }),
      n('text', 'Excerpt', { content: 'Learn the fundamentals of building a scalable design system for your team.', classes: ['text-body'] }),
      n('text', 'Date', { content: 'July 15, 2026', classes: ['text-small'], styles: { 'margin-top': '12px' } }),
    ]}),
  ],
})

const productCardTree = n('container', 'Product Card', {
  classes: ['card'],
  styles: { padding: '0', overflow: 'hidden' },
  children: [
    n('image', 'Product Image', { classes: ['img-cover'], styles: { height: '200px', 'border-radius': '0' } }),
    n('container', 'Content', { styles: { padding: '20px' }, children: [
      n('heading', 'Title', { tag: 'h3', content: 'Product Name', styles: { 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '4px' } }),
      n('text', 'Price', { content: '$49.99', styles: { 'font-size': '20px', 'font-weight': '700', color: 'var(--global-primary)' } }),
      n('text', 'Description', { content: 'A brief product description goes here.', classes: ['text-small'], styles: { 'margin-top': '8px' } }),
    ]}),
  ],
})

export const demoUserComponents: Record<string, UserComponent> = {
  'comp-header': { id: 'comp-header', name: 'Site Header', tree: headerTree },
  'comp-footer': { id: 'comp-footer', name: 'Site Footer', tree: footerTree },
  'comp-feature-card': { id: 'comp-feature-card', name: 'Feature Card', tree: featureCardTree },
  'comp-testimonial': { id: 'comp-testimonial', name: 'Testimonial Card', tree: testimonialCardTree },
  'comp-blog-card': { id: 'comp-blog-card', name: 'Blog Card', tree: blogCardTree },
  'comp-product-card': { id: 'comp-product-card', name: 'Product Card', tree: productCardTree },
}

// Shorthand for component instances
function comp(compId: string, label: string, overrides: Partial<Omit<CanvasNode, 'id' | 'type'>> = {}): CanvasNode {
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

// --- Interactions ---

const fadeInUp = (delay = 0): Interaction => ({
  id: generateInteractionId(),
  name: 'Fade In Up',
  trigger: 'scroll-into-view',
  steps: [{
    id: generateStepId(),
    target: { type: 'self' },
    delay,
    duration: 600,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '30px', to: '0px' },
    ],
  }],
  options: {},
})

const hoverScale: Interaction = {
  id: generateInteractionId(),
  name: 'Hover Scale',
  trigger: 'hover',
  steps: [{
    id: generateStepId(),
    target: { type: 'self' },
    delay: 0,
    duration: 250,
    easing: 'ease-out',
    actions: [
      { property: 'scaleX', from: '1', to: '1.02' },
      { property: 'scaleY', from: '1', to: '1.02' },
    ],
  }],
  options: { resetOnExit: true },
}

const heroEntrance: Interaction = {
  id: generateInteractionId(),
  name: 'Hero Entrance',
  trigger: 'page-load',
  steps: [
    { id: generateStepId(), target: { type: 'self' }, delay: 0, duration: 800, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '40px', to: '0px' },
    ]},
  ],
  options: {},
}

const staggerChildren: Interaction = {
  id: generateInteractionId(),
  name: 'Stagger Children',
  trigger: 'scroll-into-view',
  steps: [{
    id: generateStepId(),
    target: { type: 'children' },
    delay: 0,
    duration: 500,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    stagger: 100,
    actions: [
      { property: 'opacity', from: '0', to: '1' },
      { property: 'translateY', from: '20px', to: '0px' },
    ],
  }],
  options: {},
}

// --- Pages ---

const homePage: Page = {
  id: 'demo-page-home',
  name: 'Home',
  slug: '/',
  pageType: 'page',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      // Header
      comp('comp-header', 'Site Header'),

      // Hero Section
      n('section', 'Hero', {
        tag: 'section',
        classes: ['hero'],
        interactions: [heroEntrance],
        children: [
          n('container', 'Hero Inner', { classes: ['container', 'flex-col', 'text-center'], styles: { 'align-items': 'center' }, children: [
            n('text', 'Badge', { tag: 'span', content: 'Now in Beta', classes: ['badge', 'mb-md'] }),
            n('heading', 'Hero Title', { tag: 'h1', content: 'Build stunning websites without code', classes: ['heading-hero', 'mb-md'] }),
            n('text', 'Hero Subtitle', { content: 'The visual page builder that combines the precision of Figma with the publishing power of Webflow. Design, build, and launch — all in your WordPress dashboard.', classes: ['text-large', 'mx-auto', 'mb-lg'] }),
            n('container', 'CTA Buttons', { classes: ['flex-row'], styles: { 'justify-content': 'center' }, children: [
              n('button', 'Primary CTA', { content: 'Start Building Free', classes: ['btn', 'btn-primary'] }),
              n('button', 'Secondary CTA', { content: 'Watch Demo', classes: ['btn', 'btn-outline'] }),
            ]}),
          ]}),
        ],
      }),

      // Features Section
      n('section', 'Features', {
        tag: 'section',
        classes: ['section', 'bg-alt'],
        children: [
          n('container', 'Features Inner', { classes: ['container'], children: [
            n('container', 'Section Header', { classes: ['text-center', 'mb-xl'], children: [
              n('text', 'Label', { tag: 'span', content: 'Features', classes: ['label', 'mb-sm'] }),
              n('heading', 'Section Title', { tag: 'h2', content: 'Everything you need to build the web', classes: ['heading-section'] }),
              n('text', 'Section Description', { content: 'Powerful tools that make web design accessible to everyone, from beginners to experts.', classes: ['text-large', 'mx-auto'] }),
            ]}),
            n('container', 'Features Grid', {
              classes: ['grid-3'],
              interactions: [staggerChildren],
              children: [
                comp('comp-feature-card', 'Visual Editor', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'V', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'Visual Editor', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Drag and drop elements with pixel-perfect precision. See changes in real-time as you design.', classes: ['text-body'] }),
                ]}),
                comp('comp-feature-card', 'Responsive Design', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'R', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'Responsive Design', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Build for every screen size with breakpoint-specific controls and live preview.', classes: ['text-body'] }),
                ]}),
                comp('comp-feature-card', 'Class System', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'C', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'Class System', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Reusable styles with CSS class support. Change once, update everywhere.', classes: ['text-body'] }),
                ]}),
                comp('comp-feature-card', 'Interactions', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'I', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'Interactions', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Bring your designs to life with scroll, hover, and click-triggered animations.', classes: ['text-body'] }),
                ]}),
                comp('comp-feature-card', 'Components', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'K', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'Components', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Create reusable components that sync across your entire site. Edit once, update everywhere.', classes: ['text-body'] }),
                ]}),
                comp('comp-feature-card', 'WordPress Native', { children: [
                  n('container', 'Icon', { classes: ['icon-box'], children: [n('text', 'Icon', { content: 'W', styles: { 'font-size': '24px', 'font-weight': '700', color: 'var(--global-primary)' } })] }),
                  n('heading', 'Title', { tag: 'h3', content: 'WordPress Native', classes: ['heading-card'] }),
                  n('text', 'Desc', { content: 'Built as a WordPress plugin. Works with your themes, plugins, and content seamlessly.', classes: ['text-body'] }),
                ]}),
              ],
            }),
          ]}),
        ],
      }),

      // Testimonials
      n('section', 'Testimonials', {
        tag: 'section',
        classes: ['section'],
        children: [
          n('container', 'Inner', { classes: ['container'], children: [
            n('container', 'Header', { classes: ['text-center', 'mb-xl'], children: [
              n('text', 'Label', { tag: 'span', content: 'Testimonials', classes: ['label', 'mb-sm'] }),
              n('heading', 'Title', { tag: 'h2', content: 'Loved by designers and developers', classes: ['heading-section'] }),
            ]}),
            n('container', 'Grid', { classes: ['grid-3'], interactions: [staggerChildren], children: [
              comp('comp-testimonial', 'Testimonial 1'),
              comp('comp-testimonial', 'Testimonial 2', { children: [
                n('text', 'Stars', { content: '* * * * *', classes: ['star-rating'] }),
                n('text', 'Quote', { content: '"The class system is a game-changer. I can update styles globally and see changes reflected instantly across all pages."', classes: ['testimonial-quote'] }),
                n('container', 'Author', { classes: ['flex-row'], children: [
                  n('image', 'Avatar', { classes: ['img-avatar'] }),
                  n('container', 'Info', { classes: ['flex-col'], styles: { gap: '2px' }, children: [
                    n('text', 'Name', { content: 'Alex Rivera', styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
                    n('text', 'Role', { content: 'Lead Designer at StartupXYZ', classes: ['text-small'] }),
                  ]}),
                ]}),
              ]}),
              comp('comp-testimonial', 'Testimonial 3', { children: [
                n('text', 'Stars', { content: '* * * * *', classes: ['star-rating'] }),
                n('text', 'Quote', { content: '"Finally, a WordPress builder that thinks like a designer. The interaction system alone is worth switching for."', classes: ['testimonial-quote'] }),
                n('container', 'Author', { classes: ['flex-row'], children: [
                  n('image', 'Avatar', { classes: ['img-avatar'] }),
                  n('container', 'Info', { classes: ['flex-col'], styles: { gap: '2px' }, children: [
                    n('text', 'Name', { content: 'Sarah Chen', styles: { 'font-weight': '600', color: 'var(--global-text)' } }),
                    n('text', 'Role', { content: 'Freelance Developer', classes: ['text-small'] }),
                  ]}),
                ]}),
              ]}),
            ]}),
          ]}),
        ],
      }),

      // CTA Section
      n('section', 'CTA', {
        tag: 'section',
        classes: ['hero-dark'],
        interactions: [fadeInUp()],
        children: [
          n('container', 'Inner', { classes: ['container', 'text-center', 'flex-col'], styles: { 'align-items': 'center' }, children: [
            n('heading', 'CTA Title', { tag: 'h2', content: 'Ready to build something amazing?', classes: ['heading-section', 'text-white'] }),
            n('text', 'CTA Text', { content: 'Join thousands of creators who are building the web with Superbird. Start for free, no credit card required.', classes: ['text-large', 'text-white-muted', 'mx-auto', 'mb-lg'] }),
            n('container', 'Buttons', { classes: ['flex-row'], styles: { 'justify-content': 'center' }, children: [
              n('button', 'Start Free', { content: 'Start Building Free', classes: ['btn', 'btn-white'] }),
              n('button', 'Contact Sales', { content: 'Contact Sales', classes: ['btn', 'btn-outline'], styles: { color: '#ffffff', 'border-color': 'rgba(255,255,255,0.3)' } }),
            ]}),
          ]}),
        ],
      }),

      // Footer
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const aboutPage: Page = {
  id: 'demo-page-about',
  name: 'About',
  slug: 'about',
  pageType: 'page',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'About Hero', { tag: 'section', classes: ['hero'], children: [
        n('container', 'Inner', { classes: ['container-sm', 'text-center'], children: [
          n('heading', 'Title', { tag: 'h1', content: 'We believe the web should be designed, not coded', classes: ['heading-hero', 'mb-md'] }),
          n('text', 'Subtitle', { content: 'Superbird is on a mission to make professional web design accessible to everyone. No code. No compromises.', classes: ['text-large', 'mx-auto'] }),
        ]}),
      ]}),
      n('section', 'Story', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container', 'grid-2'], children: [
          n('image', 'Team Photo', { classes: ['img-hero'] }),
          n('container', 'Text', { classes: ['flex-col', 'gap-lg'], children: [
            n('heading', 'Our Story', { tag: 'h2', content: 'Started with a simple idea', classes: ['heading-section'] }),
            n('text', 'P1', { content: 'We were tired of the disconnect between design tools and the actual web. Figma is amazing for design, but you still need developers to bring it to life. WordPress is powerful, but existing builders feel like coding with a GUI.', classes: ['text-body'] }),
            n('text', 'P2', { content: 'So we built Superbird — a WordPress page builder that thinks like a design tool. With a real class system, responsive breakpoints, interactions, and reusable components.', classes: ['text-body'] }),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const contactPage: Page = {
  id: 'demo-page-contact',
  name: 'Contact',
  slug: 'contact',
  pageType: 'page',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Contact', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container-sm', 'text-center'], children: [
          n('heading', 'Title', { tag: 'h1', content: 'Get in touch', classes: ['heading-hero', 'mb-md'] }),
          n('text', 'Subtitle', { content: 'Have a question or want to learn more? We would love to hear from you.', classes: ['text-large', 'mx-auto', 'mb-xl'] }),
          n('container', 'Form', { classes: ['flex-col', 'gap-lg'], styles: { 'text-align': 'left' }, children: [
            n('container', 'Row', { classes: ['grid-2'], children: [
              n('container', 'Field', { classes: ['flex-col'], styles: { gap: '6px' }, children: [
                n('text', 'Label', { tag: 'label', content: 'First Name', styles: { 'font-size': '14px', 'font-weight': '500' } }),
                n('container', 'Input', { styles: { height: '44px', 'border-radius': '10px', border: '1px solid var(--global-border)', 'background-color': '#ffffff' } }),
              ]}),
              n('container', 'Field', { classes: ['flex-col'], styles: { gap: '6px' }, children: [
                n('text', 'Label', { tag: 'label', content: 'Last Name', styles: { 'font-size': '14px', 'font-weight': '500' } }),
                n('container', 'Input', { styles: { height: '44px', 'border-radius': '10px', border: '1px solid var(--global-border)', 'background-color': '#ffffff' } }),
              ]}),
            ]}),
            n('container', 'Field', { classes: ['flex-col'], styles: { gap: '6px' }, children: [
              n('text', 'Label', { tag: 'label', content: 'Email', styles: { 'font-size': '14px', 'font-weight': '500' } }),
              n('container', 'Input', { styles: { height: '44px', 'border-radius': '10px', border: '1px solid var(--global-border)', 'background-color': '#ffffff' } }),
            ]}),
            n('container', 'Field', { classes: ['flex-col'], styles: { gap: '6px' }, children: [
              n('text', 'Label', { tag: 'label', content: 'Message', styles: { 'font-size': '14px', 'font-weight': '500' } }),
              n('container', 'Textarea', { styles: { height: '140px', 'border-radius': '10px', border: '1px solid var(--global-border)', 'background-color': '#ffffff' } }),
            ]}),
            n('button', 'Submit', { content: 'Send Message', classes: ['btn', 'btn-primary', 'full-width'] }),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const productsPage: Page = {
  id: 'demo-page-products',
  name: 'Products',
  slug: 'products',
  pageType: 'page',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Products Hero', { tag: 'section', classes: ['section-sm'], children: [
        n('container', 'Inner', { classes: ['container', 'text-center'], children: [
          n('heading', 'Title', { tag: 'h1', content: 'Our Products', classes: ['heading-hero', 'mb-md'] }),
          n('text', 'Subtitle', { content: 'Premium themes and templates built with Superbird.', classes: ['text-large', 'mx-auto'] }),
        ]}),
      ]}),
      n('section', 'Products Grid', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container'], children: [
          n('container', 'Grid', { classes: ['grid-4'], interactions: [staggerChildren], children: [
            comp('comp-product-card', 'Starter Theme'),
            comp('comp-product-card', 'Agency Theme', { children: [
              n('image', 'Image', { classes: ['img-cover'], styles: { height: '200px', 'border-radius': '0' } }),
              n('container', 'Content', { styles: { padding: '20px' }, children: [
                n('heading', 'Title', { tag: 'h3', content: 'Agency Theme', styles: { 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '4px' } }),
                n('text', 'Price', { content: '$89.99', styles: { 'font-size': '20px', 'font-weight': '700', color: 'var(--global-primary)' } }),
                n('text', 'Desc', { content: 'Perfect for digital agencies and studios.', classes: ['text-small'], styles: { 'margin-top': '8px' } }),
              ]}),
            ]}),
            comp('comp-product-card', 'E-commerce Theme', { children: [
              n('image', 'Image', { classes: ['img-cover'], styles: { height: '200px', 'border-radius': '0' } }),
              n('container', 'Content', { styles: { padding: '20px' }, children: [
                n('heading', 'Title', { tag: 'h3', content: 'E-commerce Theme', styles: { 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '4px' } }),
                n('text', 'Price', { content: '$129.99', styles: { 'font-size': '20px', 'font-weight': '700', color: 'var(--global-primary)' } }),
                n('text', 'Desc', { content: 'Full WooCommerce integration.', classes: ['text-small'], styles: { 'margin-top': '8px' } }),
              ]}),
            ]}),
            comp('comp-product-card', 'Blog Theme', { children: [
              n('image', 'Image', { classes: ['img-cover'], styles: { height: '200px', 'border-radius': '0' } }),
              n('container', 'Content', { styles: { padding: '20px' }, children: [
                n('heading', 'Title', { tag: 'h3', content: 'Blog Theme', styles: { 'font-size': '18px', 'font-weight': '600', 'margin-bottom': '4px' } }),
                n('text', 'Price', { content: '$39.99', styles: { 'font-size': '20px', 'font-weight': '700', color: 'var(--global-primary)' } }),
                n('text', 'Desc', { content: 'Clean and minimal blog design.', classes: ['text-small'], styles: { 'margin-top': '8px' } }),
              ]}),
            ]}),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

// Templates
const singlePostTemplate: Page = {
  id: 'demo-page-single-post',
  name: 'Single Post',
  slug: 'single-post',
  pageType: 'post-template',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Post Content', { tag: 'article', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container-sm'], children: [
          n('text', 'Category', { content: 'Design', classes: ['badge', 'mb-md'], dynamicField: 'post_categories' }),
          n('heading', 'Post Title', { tag: 'h1', content: 'How to Build a Modern Design System', classes: ['heading-hero', 'mb-md'], dynamicField: 'post_title' }),
          n('container', 'Meta', { classes: ['flex-row', 'mb-lg'], children: [
            n('image', 'Author Avatar', { classes: ['img-avatar'], dynamicField: 'post_featured_image' }),
            n('container', 'Info', { classes: ['flex-col'], styles: { gap: '2px' }, children: [
              n('text', 'Author', { content: 'John Doe', styles: { 'font-weight': '600' }, dynamicField: 'post_author' }),
              n('text', 'Date', { content: 'July 15, 2026', classes: ['text-small'], dynamicField: 'post_date' }),
            ]}),
          ]}),
          n('image', 'Featured Image', { classes: ['img-hero', 'mb-xl'], dynamicField: 'post_featured_image' }),
          n('container', 'Content', { classes: ['text-body'], dynamicField: 'post_content', children: [
            n('text', 'P1', { content: 'A design system is a collection of reusable components, guided by clear standards, that can be assembled together to build any number of applications. It serves as the single source of truth for your design and development teams.', classes: ['text-body'] }),
            n('heading', 'Subheading', { tag: 'h2', content: 'Why You Need a Design System', classes: ['heading-section'], styles: { 'margin-top': '32px' } }),
            n('text', 'P2', { content: 'Without a design system, teams end up recreating the same components over and over again. This leads to inconsistency, wasted time, and frustrated developers. A well-built design system solves all of these problems.', classes: ['text-body'] }),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const singleProductTemplate: Page = {
  id: 'demo-page-single-product',
  name: 'Single Product',
  slug: 'single-product',
  pageType: 'product-template',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Product', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container', 'grid-2'], children: [
          n('image', 'Product Gallery', { classes: ['img-hero'], dynamicField: 'product_gallery' }),
          n('container', 'Details', { classes: ['flex-col', 'gap-lg'], children: [
            n('heading', 'Product Title', { tag: 'h1', content: 'Premium Theme Bundle', classes: ['heading-hero'], dynamicField: 'product_title', styles: { 'font-size': '36px' } }),
            n('container', 'Price Box', { classes: ['flex-row'], children: [
              n('text', 'Price', { content: '$99.00', classes: ['price'], dynamicField: 'product_price' }),
              n('text', 'Period', { content: '/one-time', classes: ['price-period'] }),
            ]}),
            n('text', 'Description', { content: 'Get access to all our premium themes with lifetime updates and support. Build unlimited websites with our professionally designed templates.', classes: ['text-body'], dynamicField: 'product_description' }),
            n('container', 'Actions', { classes: ['flex-row'], children: [
              n('button', 'Add to Cart', { content: 'Add to Cart', classes: ['btn', 'btn-primary'], dynamicField: 'product_add_to_cart' }),
              n('button', 'Wishlist', { content: 'Add to Wishlist', classes: ['btn', 'btn-outline'] }),
            ]}),
            n('text', 'SKU', { content: 'SKU: THEME-BUNDLE-001', classes: ['text-small'], dynamicField: 'product_sku' }),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const blogArchiveTemplate: Page = {
  id: 'demo-page-blog',
  name: 'Blog Archive',
  slug: 'blog',
  pageType: 'archive-template',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Blog Hero', { tag: 'section', classes: ['section-sm'], children: [
        n('container', 'Inner', { classes: ['container', 'text-center'], children: [
          n('heading', 'Title', { tag: 'h1', content: 'Blog', classes: ['heading-hero', 'mb-md'], dynamicField: 'archive_title' }),
          n('text', 'Subtitle', { content: 'Insights, tutorials, and updates from the Superbird team.', classes: ['text-large', 'mx-auto'], dynamicField: 'archive_description' }),
        ]}),
      ]}),
      n('section', 'Blog Grid', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container'], children: [
          n('container', 'Grid', { classes: ['grid-3'], dynamicField: 'archive_post_loop', interactions: [staggerChildren], children: [
            comp('comp-blog-card', 'Post 1'),
            comp('comp-blog-card', 'Post 2', { children: [
              n('image', 'Thumb', { classes: ['img-cover'], styles: { 'border-radius': '0' } }),
              n('container', 'Content', { styles: { padding: '24px' }, children: [
                n('text', 'Cat', { content: 'Tutorial', classes: ['badge', 'mb-sm'] }),
                n('heading', 'Title', { tag: 'h3', content: 'Getting Started with Interactions', classes: ['heading-card'] }),
                n('text', 'Excerpt', { content: 'Create stunning scroll and hover animations without writing a single line of code.', classes: ['text-body'] }),
                n('text', 'Date', { content: 'July 10, 2026', classes: ['text-small'], styles: { 'margin-top': '12px' } }),
              ]}),
            ]}),
            comp('comp-blog-card', 'Post 3', { children: [
              n('image', 'Thumb', { classes: ['img-cover'], styles: { 'border-radius': '0' } }),
              n('container', 'Content', { styles: { padding: '24px' }, children: [
                n('text', 'Cat', { content: 'News', classes: ['badge', 'mb-sm'] }),
                n('heading', 'Title', { tag: 'h3', content: 'Superbird v2.0 is Here', classes: ['heading-card'] }),
                n('text', 'Excerpt', { content: 'We have been working hard to bring you the most powerful page builder for WordPress.', classes: ['text-body'] }),
                n('text', 'Date', { content: 'July 5, 2026', classes: ['text-small'], styles: { 'margin-top': '12px' } }),
              ]}),
            ]}),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const categoryTemplate: Page = {
  id: 'demo-page-category',
  name: 'Category',
  slug: 'category',
  pageType: 'archive-template',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', 'Category Hero', { tag: 'section', classes: ['section-sm', 'bg-alt'], children: [
        n('container', 'Inner', { classes: ['container', 'text-center'], children: [
          n('text', 'Label', { tag: 'span', content: 'Category', classes: ['label', 'mb-sm'] }),
          n('heading', 'Title', { tag: 'h1', content: 'Design', classes: ['heading-hero'], dynamicField: 'archive_title' }),
          n('text', 'Desc', { content: 'All posts about design, UI/UX, and visual creativity.', classes: ['text-large', 'mx-auto'], dynamicField: 'archive_description' }),
        ]}),
      ]}),
      n('section', 'Posts', { tag: 'section', classes: ['section'], children: [
        n('container', 'Inner', { classes: ['container'], children: [
          n('container', 'Grid', { classes: ['grid-3'], dynamicField: 'archive_post_loop', children: [
            comp('comp-blog-card', 'Post 1'),
            comp('comp-blog-card', 'Post 2'),
          ]}),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

const page404: Page = {
  id: 'demo-page-404',
  name: '404',
  slug: '404',
  pageType: 'system',
  body: n('body', 'Body', {
    tag: 'body',
    children: [
      comp('comp-header', 'Site Header'),
      n('section', '404 Content', { tag: 'section', classes: ['hero'], children: [
        n('container', 'Inner', { classes: ['container', 'text-center', 'flex-col'], styles: { 'align-items': 'center' }, children: [
          n('heading', '404', { tag: 'h1', content: '404', styles: { 'font-size': '120px', 'font-weight': '800', color: 'var(--global-primary)', 'line-height': '1', opacity: '0.2' } }),
          n('heading', 'Title', { tag: 'h2', content: 'Page not found', classes: ['heading-section'] }),
          n('text', 'Message', { content: 'Sorry, we couldn\'t find the page you\'re looking for. It might have been moved or deleted.', classes: ['text-large', 'mx-auto', 'mb-lg'] }),
          n('button', 'Go Home', { content: 'Go back home', classes: ['btn', 'btn-primary'], link: { url: '/' } }),
        ]}),
      ]}),
      comp('comp-footer', 'Site Footer'),
    ],
  }),
}

export const demoPages: Page[] = [
  homePage,
  aboutPage,
  contactPage,
  productsPage,
  singlePostTemplate,
  singleProductTemplate,
  blogArchiveTemplate,
  categoryTemplate,
  page404,
]
