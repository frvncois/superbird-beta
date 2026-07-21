import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { CONTAINER_TYPES, TEXT_EDITABLE_TYPES } from '@/constants/canvas'
import type { StyleState } from '@/types/canvas'

/**
 * Shared state and mutations for the properties sidebar sections.
 * Each section component calls this itself — everything is store-driven,
 * so multiple panel instances stay in sync.
 */
export function useNodeStyles() {
  const store = useCanvasStore()
  const globalStylesStore = useGlobalStylesStore()
  const node = computed(() => store.selectedNode)

  const isTextNode = computed(() =>
    node.value && TEXT_EDITABLE_TYPES.includes(node.value.type),
  )
  const isContainer = computed(() =>
    node.value && CONTAINER_TYPES.includes(node.value.type),
  )

  const activeClass = computed(() => {
    if (!globalStylesStore.activeClassName) return null
    return globalStylesStore.styleClasses[globalStylesStore.activeClassName] ?? null
  })

  const hasClass = computed(() => !!activeClass.value)

  // When a class is active, edit the class styles at the active breakpoint+state.
  // Otherwise, edit instance styles directly.
  const activeStyles = computed<Record<string, string>>(() => {
    if (activeClass.value) {
      const bpStyles = activeClass.value.styles[globalStylesStore.activeBreakpoint]
      return bpStyles?.[globalStylesStore.activeState] ?? {}
    }
    return node.value?.styles ?? {}
  })

  const isFlex = computed(() =>
    activeStyles.value.display === 'flex' || activeStyles.value.display === 'inline-flex',
  )

  const isGrid = computed(() => activeStyles.value.display === 'grid')

  function updateStyle(key: string, value: string) {
    // If a class is active, edit the class
    if (globalStylesStore.activeClassName) {
      globalStylesStore.updateClassStyle(globalStylesStore.activeClassName, key, value)
      return
    }
    // Otherwise, edit instance styles directly
    if (!node.value) return
    const styles = { ...node.value.styles }
    if (value) {
      styles[key] = value
    } else {
      delete styles[key]
    }
    store.updateNode(node.value.id, { styles })
  }

  function updateLinkedStyles(keys: [string, string, string, string], values: [string, string, string, string]) {
    keys.forEach((key, i) => updateStyle(key, values[i]!))
  }

  function getLinkedValues(keys: [string, string, string, string]): [string, string, string, string] {
    return keys.map((k) => activeStyles.value[k] ?? '') as [string, string, string, string]
  }

  function statesWithValues(keys: string[]): StyleState[] {
    if (!activeClass.value) return []
    const bpStyles = activeClass.value.styles[globalStylesStore.activeBreakpoint]
    if (!bpStyles) return []
    const states: StyleState[] = []
    for (const [state, styles] of Object.entries(bpStyles)) {
      if (state === 'default') continue
      if (keys.some((k) => (styles as Record<string, string>)[k])) {
        states.push(state as StyleState)
      }
    }
    return states
  }

  return {
    node,
    activeClass,
    hasClass,
    activeStyles,
    isFlex,
    isGrid,
    isTextNode,
    isContainer,
    updateStyle,
    updateLinkedStyles,
    getLinkedValues,
    statesWithValues,
  }
}
