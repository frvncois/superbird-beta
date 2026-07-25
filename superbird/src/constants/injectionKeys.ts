import type { ComputedRef, InjectionKey } from 'vue'

export interface GlobalTokens {
  colors: Record<string, string>
  sizes: Record<string, string>
}

/**
 * Design tokens provided by the editor root (EditorView) so UI primitives
 * (ColorInputUi, SizeTokenInputUi) can list them without importing stores.
 */
export const GlobalTokensKey: InjectionKey<ComputedRef<GlobalTokens>> = Symbol('GlobalTokens')

/**
 * Opens the "Create component" name prompt, hosted once at the editor root
 * (EditorView). Node context menus (canvas + layers) call it with the node id
 * so the prompt lives in a single-instance component rather than the imperative
 * dialog system.
 */
export const CreateComponentPromptKey: InjectionKey<(nodeId: string) => void> = Symbol('CreateComponentPrompt')
