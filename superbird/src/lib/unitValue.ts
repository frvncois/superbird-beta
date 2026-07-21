export interface ParsedUnitValue {
  num: string
  unit: string
}

/**
 * Parse a CSS length like "12px" / "auto" into number + unit parts.
 * Keywords listed in `keywords` parse to { num: '', unit: keyword }.
 */
export function parseUnitValue(val: string, keywords: string[] = []): ParsedUnitValue {
  const trimmed = (val ?? '').trim()
  if (!trimmed) return { num: '', unit: 'px' }
  for (const keyword of keywords) {
    if (trimmed === keyword) return { num: '', unit: keyword }
  }
  const match = trimmed.match(/^(-?[\d.]+)\s*(.*)$/)
  if (match) return { num: match[1]!, unit: match[2] || 'px' }
  return { num: trimmed, unit: 'px' }
}

/**
 * Shared arrow-key stepping for unit inputs: ±1, shift = ±10, alt = ±0.1.
 * Calls `apply` with the new "<num><unit>" value.
 */
export function stepUnitValue(e: KeyboardEvent, currentUnit: string, apply: (value: string) => void): void {
  const input = e.target as HTMLInputElement
  const num = parseFloat(input.value)
  if (isNaN(num)) return

  let step = 1
  if (e.shiftKey) step = 10
  if (e.altKey) step = 0.1

  const unit = currentUnit === 'auto' ? 'px' : currentUnit

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    apply(Math.round((num + step) * 100) / 100 + unit)
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    apply(Math.round((num - step) * 100) / 100 + unit)
  }
}
