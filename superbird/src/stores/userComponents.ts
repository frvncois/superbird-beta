import { ref } from 'vue'
import { defineStore } from 'pinia'
import { deepCloneNode } from '@/lib/nodeFactory'
import { generateComponentId } from '@/lib/ids'
import { findNode, clearComponentIds, countInstances, detachAllInstances, syncInstancesInTree } from '@/lib/tree'
import { useCanvasStore } from '@/stores/canvas'
import { demoUserComponents } from '@/data/demo'
import type { CanvasNode, UserComponent } from '@/types/canvas'

export const useUserComponentsStore = defineStore('userComponents', () => {
  const canvas = useCanvasStore()

  const userComponents = ref<Record<string, UserComponent>>(demoUserComponents)

  // Replace all user components from a loaded project document.
  function hydrate(loaded: Record<string, UserComponent>) {
    userComponents.value = loaded
  }

  function createComponentFromNode(nodeId: string, name: string): UserComponent | null {
    const body = canvas.bodyNode
    if (nodeId === body.id) return null
    const node = findNode(body.children, nodeId)
    if (!node) return null

    const compId = generateComponentId()
    const masterTree = deepCloneNode(node)
    // Strip componentId from master tree
    clearComponentIds(masterTree)

    const comp: UserComponent = { id: compId, name, tree: masterTree }
    userComponents.value[compId] = comp

    // Convert the original node into a component instance
    node.type = 'component'
    node.componentId = compId
    node.label = name

    return comp
  }

  function instantiateComponent(compId: string): CanvasNode | null {
    const comp = userComponents.value[compId]
    if (!comp) return null

    const instance = deepCloneNode(comp.tree)
    instance.type = 'component'
    instance.componentId = compId
    instance.label = comp.name
    return instance
  }

  function addComponentToPage(compId: string, targetId?: string, position?: 'before' | 'after' | 'inside') {
    const instance = instantiateComponent(compId)
    if (!instance) return
    canvas.insertNode(instance, targetId, position)
  }

  function syncComponentInstances(compId: string) {
    const comp = userComponents.value[compId]
    if (!comp) return

    // Sync across all pages
    for (const page of canvas.pages) {
      syncInstancesInTree(page.body, comp)
    }
  }

  function updateComponentDefinition(compId: string, updatedNode: CanvasNode) {
    const comp = userComponents.value[compId]
    if (!comp) return
    const masterTree = deepCloneNode(updatedNode)
    clearComponentIds(masterTree)
    comp.tree = masterTree
    syncComponentInstances(compId)
  }

  function detachComponentInstance(nodeId: string) {
    const body = canvas.bodyNode
    const node = findNode(body.children, nodeId)
    if (!node || node.type !== 'component') return
    node.type = 'container'
    delete node.componentId
    delete node.contentOverrides
  }

  function deleteComponent(compId: string) {
    // Detach all instances first
    for (const page of canvas.pages) {
      detachAllInstances(page.body, compId)
    }
    delete userComponents.value[compId]
  }

  function getComponentInstanceCount(compId: string): number {
    let count = 0
    for (const page of canvas.pages) {
      count += countInstances(page.body, compId)
    }
    return count
  }

  return {
    userComponents,
    hydrate,
    createComponentFromNode,
    instantiateComponent,
    addComponentToPage,
    updateComponentDefinition,
    detachComponentInstance,
    deleteComponent,
    getComponentInstanceCount,
  }
})
