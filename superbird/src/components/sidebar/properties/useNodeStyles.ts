import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { CONTAINER_TYPES } from '@/constants/canvas'
import { tailwindToStyles } from '@/lib/tailwindToStyles'
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

  const isContainer = computed(() =>
    node.value && CONTAINER_TYPES.includes(node.value.type),
  )
  const isImage = computed(() => node.value?.type === 'image')

  const activeClass = computed(() => {
    if (!globalStylesStore.activeClassName) return null
    return globalStylesStore.styleClasses[globalStylesStore.activeClassName] ?? null
  })

  // When a class is active, edit the class styles at the active breakpoint+state.
  // Otherwise, edit instance styles directly. Tailwind utilities on the node are
  // merged in as a read-through base so the panel reflects their values (e.g.
  // p-6 shows as padding). Editing writes to the class / instance styles on top.
  const activeStyles = computed<Record<string, string>>(() => {
    const tw = node.value ? tailwindToStyles(node.value.classes) : {}
    const own = activeClass.value
      ? (activeClass.value.styles[globalStylesStore.activeBreakpoint]?.[globalStylesStore.activeState] ?? {})
      : (node.value?.styles ?? {})
    return { ...tw, ...own }
  })

  const isFlex = computed(() =>
    activeStyles.value.display === 'flex' || activeStyles.value.display === 'inline-flex',
  )

  const isGrid = computed(() => activeStyles.value.display === 'grid')

  function updateStyle(key: string, value: string) {
    const active = globalStylesStore.activeClassName
    if (active) {
      // Tailwind utilities aren't editable style classes — never mutate them.
      // Spill the edit into a fresh custom class appended at the end (last wins),
      // e.g. `.hero-home .mb-4` → `.hero-home .mb-4 .class`.
      if (!globalStylesStore.styleClasses[active]) {
        if (!node.value) return
        const newName = store.createCustomClassOnNode(node.value.id)
        globalStylesStore.updateClassStyle(newName, key, value)
        return
      }
      globalStylesStore.updateClassStyle(active, key, value)
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

  // Two-way binding helpers so sections bind a control with `v-bind="field('key')"`
  // (or `v-bind="linked([...])"` for a 4-way linked input) instead of repeating
  // `:model-value` + `@update:model-value` — and the property key — per control.
  function field(key: string) {
    return {
      modelValue: activeStyles.value[key] ?? '',
      'onUpdate:modelValue': (value: string) => updateStyle(key, value),
    }
  }

  function linked(keys: [string, string, string, string]) {
    return {
      modelValue: getLinkedValues(keys),
      'onUpdate:modelValue': (values: [string, string, string, string]) => updateLinkedStyles(keys, values),
    }
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
    activeStyles,
    isFlex,
    isGrid,
    isContainer,
    isImage,
    updateStyle,
    field,
    linked,
    statesWithValues,
  }
}
