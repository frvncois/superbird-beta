import type { ComputedRef, Ref } from 'vue'
import { findNode, renameClassInTree, removeClassFromTree } from '@/lib/tree'
import { isTailwindUtility } from '@/lib/tailwindToStyles'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import type { Page } from '@/types/canvas'

// The class ↔ node wiring, extracted from the canvas store. These mutate BOTH
// the page tree (node.classes) and the globalStyles store's records, keeping the
// two in sync (rename/delete propagate across every page). Spread into the store
// so `store.addClassToNode` etc. are unchanged.
export function useClassBindings(activePage: ComputedRef<Page>, pages: Ref<Page[]>) {
  const globalStylesStore = useGlobalStylesStore()

  function renameClass(oldName: string, newName: string) {
    const cls = globalStylesStore.styleClasses[oldName]
    if (!cls || globalStylesStore.styleClasses[newName]) return
    cls.name = newName
    globalStylesStore.styleClasses[newName] = cls
    delete globalStylesStore.styleClasses[oldName]
    // Update all nodes referencing the old name
    for (const page of pages.value) {
      renameClassInTree(page.body, oldName, newName)
    }
    if (globalStylesStore.activeClassName === oldName) {
      globalStylesStore.setActiveClass(newName)
    }
  }

  function deleteStyleClass(name: string) {
    delete globalStylesStore.styleClasses[name]
    // Remove from all nodes
    for (const page of pages.value) {
      removeClassFromTree(page.body, name)
    }
    if (globalStylesStore.activeClassName === name) {
      globalStylesStore.setActiveClass(null)
    }
  }

  function addClassToNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    if (node.classes.includes(className)) return

    // Tailwind utilities are raw classes — not editable style classes.
    if (isTailwindUtility(className)) {
      node.classes.push(className)
      return
    }

    const isNew = !globalStylesStore.styleClasses[className]
    if (isNew) {
      globalStylesStore.createStyleClass(className)
    }

    // Migrate instance styles into the class if new, otherwise just discard them
    const hasInstanceStyles = Object.keys(node.styles).length > 0
    if (hasInstanceStyles) {
      if (isNew) {
        const cls = globalStylesStore.styleClasses[className]!
        const desktop = (cls.styles.desktop ??= { default: {}, hover: {}, focus: {}, active: {}, visited: {} })
        Object.assign(desktop.default, node.styles)
      }
      node.styles = {}
    }

    node.classes.push(className)
    globalStylesStore.setActiveClass(className)
  }

  function removeClassFromNode(nodeId: string, className: string) {
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (!node) return
    node.classes = node.classes.filter((c) => c !== className)
    if (globalStylesStore.activeClassName === className) {
      globalStylesStore.setActiveClass(node.classes.length > 0 ? node.classes[node.classes.length - 1]! : null)
    }
  }

  // Find a class name not yet taken by any style class.
  function uniqueClassName(base: string): string {
    if (!globalStylesStore.styleClasses[base]) return base
    let n = 2
    while (globalStylesStore.styleClasses[`${base}-${n}`]) n++
    return `${base}-${n}`
  }

  // Duplicate a style class into a new one (styles copied) and swap it in on the
  // node in place of the original, so this element can diverge. Tailwind
  // utilities aren't real style classes — nothing to duplicate. Returns the new
  // name (for inline rename).
  function duplicateClass(nodeId: string, className: string): string | null {
    const cls = globalStylesStore.styleClasses[className]
    if (!cls) return null
    const newName = uniqueClassName(`${className}-copy`)
    globalStylesStore.styleClasses[newName] = {
      name: newName,
      styles: JSON.parse(JSON.stringify(cls.styles)),
    }
    const body = activePage.value.body
    const node = nodeId === body.id ? body : findNode(body.children, nodeId)
    if (node) {
      const i = node.classes.indexOf(className)
      if (i !== -1) node.classes.splice(i, 1, newName)
    }
    globalStylesStore.setActiveClass(newName)
    return newName
  }

  // Create a fresh, empty custom style class and append it to the node. Used when
  // the user tries to edit properties while a Tailwind utility is the active
  // class — we never mutate Tailwind classes, so styling spills into a new class
  // added at the end (last wins). Returns the new name.
  function createCustomClassOnNode(nodeId: string): string {
    let name = randomClassName()
    while (globalStylesStore.styleClasses[name]) name = randomClassName()
    addClassToNode(nodeId, name)
    return name
  }

  // A short random class name (5 lowercase letters) — leading letter keeps it a
  // valid CSS identifier.
  function randomClassName(): string {
    let s = ''
    for (let i = 0; i < 5; i++) s += String.fromCharCode(97 + Math.floor(Math.random() * 26))
    return s
  }

  return {
    renameClass,
    deleteStyleClass,
    duplicateClass,
    createCustomClassOnNode,
    addClassToNode,
    removeClassFromNode,
  }
}
