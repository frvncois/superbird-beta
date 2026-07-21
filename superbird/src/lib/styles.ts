import type { Breakpoint, CanvasNode, StyleClass, StyleState } from '@/types/canvas'

/**
 * Resolve the effective styles for a node: class styles cascaded across
 * breakpoints (desktop is base, tablet overrides, mobile overrides tablet),
 * state styles layered on top of default, instance styles last.
 */
export function resolveStyles(
  node: CanvasNode,
  styleClasses: Record<string, StyleClass>,
  breakpoint: Breakpoint,
  state: StyleState = 'default',
): Record<string, string> {
  const merged: Record<string, string> = {}

  const cascade: Breakpoint[] =
    breakpoint === 'mobile' ? ['desktop', 'tablet', 'mobile'] :
    breakpoint === 'tablet' ? ['desktop', 'tablet'] :
    ['desktop']

  for (const className of node.classes) {
    const cls = styleClasses[className]
    if (!cls) continue
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
