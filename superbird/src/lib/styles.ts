import type { BreakpointDef, BreakpointId, CanvasNode, StyleClass, StyleState } from '@/types/canvas'
import { classToDecls } from '@/lib/tailwindToStyles'

// Cascade for the active breakpoint: every breakpoint at least as wide as it,
// ordered widest→narrowest, so a narrower breakpoint overrides a wider base
// (e.g. active `mobile` → [desktop, tablet, mobile]). Falls back to the active
// id alone when the registry isn't supplied.
export function breakpointCascade(breakpoint: BreakpointId, breakpoints: BreakpointDef[]): BreakpointId[] {
  const activeWidth = breakpoints.find((b) => b.id === breakpoint)?.width
  if (activeWidth == null) return [breakpoint]
  return breakpoints
    .filter((b) => b.width >= activeWidth)
    .sort((a, b) => b.width - a.width)
    .map((b) => b.id)
}

/**
 * Resolve the effective styles for a node: each class applied in the order it
 * appears on the node (later overrides earlier), cascaded across breakpoints
 * (widest base → narrower overrides) with the active state layered on default;
 * instance styles last. Custom style classes and base Tailwind utilities are
 * resolved together so a Tailwind class added after a custom one overrides it
 * (variant utilities like hover:/md: are handled by generated CSS instead).
 */
export function resolveStyles(
  node: CanvasNode,
  styleClasses: Record<string, StyleClass>,
  breakpoint: BreakpointId,
  state: StyleState = 'default',
  breakpoints: BreakpointDef[] = [],
): Record<string, string> {
  const merged: Record<string, string> = {}

  const cascade = breakpointCascade(breakpoint, breakpoints)

  for (const className of node.classes) {
    const cls = styleClasses[className]
    if (!cls) {
      // Not a custom style class → try a base Tailwind utility (in order).
      const d = classToDecls(className)
      if (d) Object.assign(merged, d)
      continue
    }
    // Apply each breakpoint in cascade order
    for (const b of cascade) {
      const bpStyles = cls.styles[b]
      if (!bpStyles) continue
      // Always apply default state first
      Object.assign(merged, bpStyles.default)
      // Layer the active state on top
      if (state !== 'default' && bpStyles[state]) {
        Object.assign(merged, bpStyles[state])
      }
    }
  }
  Object.assign(merged, node.styles)
  return merged
}
