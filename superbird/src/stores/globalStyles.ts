import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createStyleClassStyles } from '@/lib/nodeFactory'
import { resolveStyles as resolveNodeStyles } from '@/lib/styles'
import { BREAKPOINTS } from '@/constants/canvas'
import { demoGlobalStyles, demoStyleClasses } from '@/data/demo'
import type { Breakpoint, CanvasNode, GlobalStyles, HeadingStyle, StyleClass, StyleState, TypographySettings } from '@/types/canvas'

/**
 * Design tokens (colors/fonts/sizes/typography) and the global style-class
 * registry, plus the active breakpoint/state the editor is viewing.
 * Node-tree concerns (which node has which class) live in the canvas store.
 */
export const useGlobalStylesStore = defineStore('globalStyles', () => {
  // --- Design tokens ---

  const globalStyles = ref<GlobalStyles>(demoGlobalStyles)
  const globalStylesPanelOpen = ref(false)

  function openPanel() {
    globalStylesPanelOpen.value = true
  }

  function closePanel() {
    globalStylesPanelOpen.value = false
  }

  function setGlobalColor(name: string, value: string) {
    globalStyles.value.colors[name] = value
  }

  function removeGlobalColor(name: string) {
    delete globalStyles.value.colors[name]
  }

  function addGlobalColor(name: string, value: string) {
    globalStyles.value.colors[name] = value
  }

  function setGlobalFont(key: 'primary' | 'secondary', value: string) {
    globalStyles.value.fonts[key] = value
  }

  function setGlobalSize(name: string, value: string) {
    globalStyles.value.sizes[name] = value
  }

  function removeGlobalSize(name: string) {
    delete globalStyles.value.sizes[name]
  }

  function addGlobalSize(name: string, value: string) {
    globalStyles.value.sizes[name] = value
  }

  function updateTypography(bp: Breakpoint, key: keyof TypographySettings, value: any) {
    ;(globalStyles.value.typography[bp] as any)[key] = value
  }

  function updateHeadingStyle(bp: Breakpoint, tag: string, partial: Partial<HeadingStyle>) {
    const headings = globalStyles.value.typography[bp].headings
    const key = tag as keyof typeof headings
    headings[key] = { ...headings[key], ...partial }
  }

  // CSS variables generated from global styles
  const globalCssVars = computed(() => {
    const vars: Record<string, string> = {}
    for (const [name, value] of Object.entries(globalStyles.value.colors)) {
      vars[`--global-${name}`] = value
    }
    vars['--global-font-primary'] = globalStyles.value.fonts.primary
    vars['--global-font-secondary'] = globalStyles.value.fonts.secondary
    for (const [name, value] of Object.entries(globalStyles.value.sizes)) {
      vars[`--global-size-${name}`] = value
    }
    return vars
  })

  // --- Style classes (global, shared across pages) ---

  const styleClasses = ref<Record<string, StyleClass>>(demoStyleClasses)
  const activeClassName = ref<string | null>(null)
  const activeState = ref<StyleState>('default')
  const activeBreakpoint = ref<Breakpoint>('desktop')

  const activeViewportWidth = computed(() =>
    BREAKPOINTS.find((b) => b.key === activeBreakpoint.value)?.width ?? 1280,
  )

  const allClassNames = computed(() => Object.keys(styleClasses.value).sort())

  function createStyleClass(name: string): StyleClass {
    const cls: StyleClass = { name, styles: createStyleClassStyles() }
    styleClasses.value[name] = cls
    return cls
  }

  function setActiveBreakpoint(bp: Breakpoint) {
    activeBreakpoint.value = bp
  }

  function updateClassStyle(name: string, key: string, value: string, state?: StyleState, breakpoint?: Breakpoint) {
    const cls = styleClasses.value[name]
    if (!cls) return
    const bp = breakpoint ?? activeBreakpoint.value
    const s = state ?? activeState.value
    if (!cls.styles[bp]) cls.styles[bp] = { default: {}, hover: {}, focus: {}, active: {}, visited: {} }
    if (!cls.styles[bp][s]) cls.styles[bp][s] = {}
    if (value) {
      cls.styles[bp][s][key] = value
    } else {
      delete cls.styles[bp][s][key]
    }
  }

  function setActiveState(state: StyleState) {
    activeState.value = state
  }

  function setActiveClass(name: string | null) {
    activeClassName.value = name
  }

  function resolveStyles(node: CanvasNode, state: StyleState = 'default'): Record<string, string> {
    return resolveNodeStyles(node, styleClasses.value, activeBreakpoint.value, state)
  }

  return {
    // Design tokens
    globalStyles,
    globalStylesPanelOpen,
    globalCssVars,
    openPanel,
    closePanel,
    setGlobalColor,
    removeGlobalColor,
    addGlobalColor,
    setGlobalFont,
    setGlobalSize,
    removeGlobalSize,
    addGlobalSize,
    updateTypography,
    updateHeadingStyle,
    // Style classes
    styleClasses,
    activeClassName,
    activeState,
    activeBreakpoint,
    activeViewportWidth,
    allClassNames,
    createStyleClass,
    updateClassStyle,
    setActiveState,
    setActiveBreakpoint,
    setActiveClass,
    resolveStyles,
  }
})
