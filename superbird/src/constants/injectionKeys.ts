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
