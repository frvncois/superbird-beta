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
 * Interpret the raw text of a unit input's number field on each keystroke. The
 * field only ever *displays* the number — the unit lives in the dropdown — but
 * a user may type the unit inline (e.g. "90em"): we detect it and move it to
 * the dropdown. `units` is the set of selectable units (matched case-insensitively).
 *
 * Returns:
 *  - `model`: the new "<num><unit>" value ("" when blank/cleared)
 *  - `draft`: the exact text the field should keep showing while a unit is still
 *     being typed — i.e. a suffix that could still become a valid unit (a prefix
 *     of one). `null` means snap the field back to the number (unit adopted,
 *     plain number, or stray text stripped).
 */
export function readUnitInput(
  raw: string,
  currentUnit: string,
  units: string[],
): { model: string; draft: string | null } {
  const unit = currentUnit === 'auto' || currentUnit === 'token' ? 'px' : currentUnit
  const m = raw.match(/^\s*(-?\d*\.?\d*)\s*([a-zA-Z%]*)\s*$/)
  if (!m) return { model: '', draft: raw } // unparseable — leave it for blur to fix

  const numStr = m[1] ?? ''
  const suffix = (m[2] ?? '').toLowerCase()
  const hasNum = /^-?\d*\.?\d+$/.test(numStr)
  const numModel = hasNum ? numStr + unit : ''

  if (!suffix) return { model: numModel, draft: null } // plain (or partial "-", "5.")

  // A complete, recognized unit → adopt it and strip it from the field.
  const exact = units.find((u) => u.toLowerCase() === suffix)
  if (exact && hasNum) return { model: numStr + exact, draft: null }

  // Non-exact suffix: keep showing it only while it could still complete into a
  // valid unit (typing "e" toward "em"); otherwise strip it now.
  const couldComplete = units.some((u) => u.toLowerCase().startsWith(suffix))
  return { model: numModel, draft: couldComplete ? raw : null }
}

/**
 * Finalize a unit field on blur/commit: adopt a fully-typed unit if one is
 * present, else keep the current unit; always collapse back to "<num><unit>".
 */
export function commitUnitInput(raw: string, currentUnit: string, units: string[]): string {
  const unit = currentUnit === 'auto' || currentUnit === 'token' ? 'px' : currentUnit
  const m = raw.match(/(-?\d*\.?\d+)\s*([a-zA-Z%]*)/)
  if (!m) return ''
  const exact = units.find((u) => u.toLowerCase() === (m[2] ?? '').toLowerCase())
  return m[1]! + (exact ?? unit)
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
