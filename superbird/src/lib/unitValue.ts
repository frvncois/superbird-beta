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
 * Compute the next model value from the raw text of a unit input's number
 * field, given the current unit. The number field must only ever hold the
 * numeric part — the unit lives in the dropdown — so this strips any stray
 * non-numeric text (preventing the "pxpxpx" append cascade).
 *
 * Returns `model` (the new "<num><unit>" value, or "" when cleared) and
 * `force`: the string the DOM input should be reset to when it contained
 * junk, or `null` to leave the DOM alone (so the cursor and in-progress
 * values like "-" or "5." aren't disturbed).
 */
export function nextUnitValue(rawInput: string, currentUnit: string): { model: string; force: string | null } {
  const unit = currentUnit === 'auto' || currentUnit === 'token' ? 'px' : currentUnit

  // Pure or partial numeric ("", "-", ".", "5.", "-5", "12.5"): trust the DOM
  if (/^-?\d*\.?\d*$/.test(rawInput)) {
    if (rawInput === '' || rawInput === '-' || rawInput === '.' || rawInput === '-.') {
      return { model: '', force: null }
    }
    return { model: rawInput + unit, force: null }
  }

  // Contains stray characters (e.g. a typed unit): keep only the number
  const match = rawInput.match(/-?\d*\.?\d+/)
  const num = match ? match[0] : ''
  return { model: num ? num + unit : '', force: num }
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
