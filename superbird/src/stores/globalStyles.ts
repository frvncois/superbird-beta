import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createStyleClassStyles } from '@/lib/nodeFactory'
import { resolveStyles as resolveNodeStyles } from '@/lib/styles'
import { deviceType, DEFAULT_BREAKPOINTS } from '@/constants/canvas'
import { generateBreakpointId } from '@/lib/ids'
import { demoGlobalStyles, demoStyleClasses } from '@/data/demo'
import type { Breakpoint, BreakpointDef, BreakpointId, CanvasNode, FontFamily, GlobalStyles, HeadingStyle, StyleClass, StyleState, TypographySettings } from '@/types/canvas'

/**
 * Design tokens (colors/fonts/sizes/typography) and the global style-class
 * registry, plus the active breakpoint/state the editor is viewing.
 * Node-tree concerns (which node has which class) live in the canvas store.
 */
export const useGlobalStylesStore = defineStore('globalStyles', () => {
  // --- Design tokens ---

  const globalStyles = ref<GlobalStyles>(demoGlobalStyles)
  const globalStylesPanelOpen = ref(false)

  // Replace tokens + style-class registry from a loaded project document.
  function hydrate(loaded: { globalStyles: GlobalStyles; styleClasses: Record<string, StyleClass> }) {
    // Backfill the breakpoint registry for docs saved before it existed.
    if (!loaded.globalStyles.breakpoints?.length) {
      loaded.globalStyles.breakpoints = DEFAULT_BREAKPOINTS.map((b) => ({ ...b }))
    }
    globalStyles.value = loaded.globalStyles
    styleClasses.value = loaded.styleClasses
  }

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

  function setGlobalFont(name: string, value: string) {
    globalStyles.value.fonts[name] = value
  }

  function addGlobalFont(name: string, value: string) {
    globalStyles.value.fonts[name] = value
  }

  function removeGlobalFont(name: string) {
    delete globalStyles.value.fonts[name]
  }

  // --- Font set (self-hosted Google/Fontshare/custom fonts) ---

  function addFontFamily(family: FontFamily) {
    if (!globalStyles.value.fontSet) globalStyles.value.fontSet = []
    const set = globalStyles.value.fontSet
    // Merge faces into an existing family of the same name+source, else append.
    const existing = set.find((f) => f.name === family.name && f.source === family.source)
    if (existing) {
      for (const face of family.faces) {
        const dup = existing.faces.find((x) => x.weight === face.weight && x.style === face.style)
        if (!dup) existing.faces.push(face)
      }
    } else {
      set.push(family)
    }
  }

  function removeFontFamily(id: string) {
    const set = globalStyles.value.fontSet
    if (!set) return
    globalStyles.value.fontSet = set.filter((f) => f.id !== id)
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
    for (const [name, value] of Object.entries(globalStyles.value.fonts)) {
      vars[`--global-font-${name}`] = value
    }
    for (const [name, value] of Object.entries(globalStyles.value.sizes)) {
      vars[`--global-size-${name}`] = value
    }
    return vars
  })

  // --- Style classes (global, shared across pages) ---

  const styleClasses = ref<Record<string, StyleClass>>(demoStyleClasses)
  const activeClassName = ref<string | null>(null)
  const activeState = ref<StyleState>('default')
  const activeBreakpoint = ref<BreakpointId>('desktop')

  // The project's breakpoint registry (styling), widest→narrowest is the cascade.
  const breakpoints = computed<BreakpointDef[]>(() =>
    globalStyles.value.breakpoints?.length ? globalStyles.value.breakpoints : DEFAULT_BREAKPOINTS,
  )
  const activeViewportWidth = computed(() =>
    breakpoints.value.find((b) => b.id === activeBreakpoint.value)?.width ?? 1280,
  )
  // Coarse device of the active breakpoint — drives visibility + typography reads.
  const activeDevice = computed<Breakpoint>(() => deviceType(activeViewportWidth.value))
  // The widest breakpoint is the base; the canvas shows it unconstrained.
  const isBaseViewport = computed(() =>
    activeViewportWidth.value >= Math.max(...breakpoints.value.map((b) => b.width)),
  )

  const allClassNames = computed(() => Object.keys(styleClasses.value).sort())

  // Recently-used classes (MRU, ephemeral) for the class-input dropdown.
  const recentClasses = ref<string[]>([])
  function noteClassUsed(name: string) {
    recentClasses.value = [name, ...recentClasses.value.filter((n) => n !== name)].slice(0, 12)
  }

  function createStyleClass(name: string): StyleClass {
    const cls: StyleClass = { name, styles: createStyleClassStyles() }
    styleClasses.value[name] = cls
    return cls
  }

  function setActiveBreakpoint(id: BreakpointId) {
    activeBreakpoint.value = id
  }

  // Add a breakpoint to the registry and switch to it. A narrower/middle
  // breakpoint needs no styles — it cascades from the next-wider one until set.
  // But a new *widest* breakpoint becomes the base rule (nothing wider to cascade
  // from), so seed every class's styles at it from the previous widest — otherwise
  // elements would render bare above the old top width. We copy (not move) so
  // removing this breakpoint later restores the previous base intact.
  function addBreakpoint(name: string, width: number): BreakpointDef {
    const existing = breakpoints.value
    const prevWidest = existing.reduce<BreakpointDef | null>((m, b) => (!m || b.width > m.width ? b : m), null)
    const bp: BreakpointDef = { id: generateBreakpointId(), name: name.trim() || `${width}px`, width }
    globalStyles.value.breakpoints = [...existing, bp]

    if (prevWidest && width > prevWidest.width) {
      for (const cls of Object.values(styleClasses.value)) {
        const src = cls.styles[prevWidest.id]
        if (src) cls.styles[bp.id] = JSON.parse(JSON.stringify(src)) as typeof src
      }
    }

    activeBreakpoint.value = bp.id
    return bp
  }

  function removeBreakpoint(id: BreakpointId) {
    const next = breakpoints.value.filter((b) => b.id !== id)
    if (next.length === 0) return // keep at least the base breakpoint
    globalStyles.value.breakpoints = next
    if (activeBreakpoint.value === id) {
      activeBreakpoint.value = [...next].sort((a, b) => b.width - a.width)[0]!.id
    }
  }

  function updateBreakpoint(id: BreakpointId, patch: Partial<Pick<BreakpointDef, 'name' | 'width'>>) {
    const bp = breakpoints.value.find((b) => b.id === id)
    if (bp) Object.assign(bp, patch)
  }

  function updateClassStyle(name: string, key: string, value: string, state?: StyleState, breakpoint?: BreakpointId) {
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
    return resolveNodeStyles(node, styleClasses.value, activeBreakpoint.value, state, breakpoints.value)
  }

  return {
    // Design tokens
    globalStyles,
    hydrate,
    globalStylesPanelOpen,
    globalCssVars,
    openPanel,
    closePanel,
    setGlobalColor,
    removeGlobalColor,
    addGlobalColor,
    setGlobalFont,
    addGlobalFont,
    removeGlobalFont,
    addFontFamily,
    removeFontFamily,
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
    breakpoints,
    activeViewportWidth,
    activeDevice,
    isBaseViewport,
    allClassNames,
    recentClasses,
    noteClassUsed,
    createStyleClass,
    updateClassStyle,
    setActiveState,
    setActiveBreakpoint,
    addBreakpoint,
    removeBreakpoint,
    updateBreakpoint,
    setActiveClass,
    resolveStyles,
  }
})
