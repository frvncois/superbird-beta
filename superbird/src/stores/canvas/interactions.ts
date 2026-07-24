import type { ComputedRef } from 'vue'
import { findNode } from '@/lib/tree'
import { generateInteractionId, generateStepId } from '@/lib/ids'
import type {
  AnimateAction,
  ClassAction,
  Interaction,
  InteractionAction,
  InteractionStep,
  InteractionTarget,
  Page,
  TriggerType,
} from '@/types/canvas'

// Interactions CRUD, extracted from the canvas store. Interactions live inside
// nodes (`node.interactions`), so these mutate the active page's tree in place —
// the canvas store spreads this into its return, keeping `store.addInteraction`
// etc. unchanged, and history still tracks it via the `pages` deep watch.
export function useInteractionOps(activePage: ComputedRef<Page>) {
  function nodeById(nodeId: string) {
    const body = activePage.value.body
    return nodeId === body.id ? body : findNode(body.children, nodeId)
  }

  function getNodeInteractions(nodeId: string): Interaction[] {
    return nodeById(nodeId)?.interactions ?? []
  }

  function addInteraction(nodeId: string, trigger: TriggerType, name?: string): Interaction | null {
    const node = nodeById(nodeId)
    if (!node) return null
    if (!node.interactions) node.interactions = []
    const ix: Interaction = {
      id: generateInteractionId(),
      name: name ?? `${trigger} interaction`,
      trigger,
      steps: [],
      options: {},
    }
    node.interactions.push(ix)
    return ix
  }

  // Returns the removed interaction + its index so callers can offer an Undo.
  function removeInteraction(nodeId: string, interactionId: string): { interaction: Interaction; index: number } | null {
    const node = nodeById(nodeId)
    if (!node?.interactions) return null
    const index = node.interactions.findIndex((ix) => ix.id === interactionId)
    if (index === -1) return null
    const [interaction] = node.interactions.splice(index, 1)
    return interaction ? { interaction, index } : null
  }

  function restoreInteraction(nodeId: string, interaction: Interaction, index: number) {
    const node = nodeById(nodeId)
    if (!node) return
    if (!node.interactions) node.interactions = []
    const clamped = Math.min(Math.max(index, 0), node.interactions.length)
    node.interactions.splice(clamped, 0, interaction)
  }

  function updateInteraction(nodeId: string, interactionId: string, updates: Partial<Pick<Interaction, 'name' | 'trigger' | 'triggerValue' | 'options'>>) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return
    Object.assign(ix, updates)
  }

  function addStep(nodeId: string, interactionId: string, target?: InteractionTarget): InteractionStep | null {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return null
    const step: InteractionStep = {
      id: generateStepId(),
      target: target ?? { type: 'self' },
      delay: 0,
      duration: 300,
      easing: 'ease-out',
      actions: [],
    }
    ix.steps.push(step)
    return step
  }

  function removeStep(nodeId: string, interactionId: string, stepId: string) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    if (!ix) return
    ix.steps = ix.steps.filter((s) => s.id !== stepId)
  }

  function updateStep(nodeId: string, interactionId: string, stepId: string, updates: Partial<Pick<InteractionStep, 'target' | 'delay' | 'duration' | 'easing' | 'stagger'>>) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    Object.assign(step, updates)
  }

  function addActionToStep(nodeId: string, interactionId: string, stepId: string, action: InteractionAction) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    step.actions.push(action)
  }

  function removeActionFromStep(nodeId: string, interactionId: string, stepId: string, actionIndex: number) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step) return
    step.actions.splice(actionIndex, 1)
  }

  function updateActionInStep(nodeId: string, interactionId: string, stepId: string, actionIndex: number, updates: Partial<AnimateAction> | Partial<ClassAction>) {
    const ix = nodeById(nodeId)?.interactions?.find((i) => i.id === interactionId)
    const step = ix?.steps.find((s) => s.id === stepId)
    if (!step || !step.actions[actionIndex]) return
    Object.assign(step.actions[actionIndex], updates)
  }

  return {
    getNodeInteractions,
    addInteraction,
    removeInteraction,
    restoreInteraction,
    updateInteraction,
    addStep,
    removeStep,
    updateStep,
    addActionToStep,
    removeActionFromStep,
    updateActionInStep,
  }
}
