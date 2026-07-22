// Parse a Tailwind utility class into a human-readable label + value, and the
// set of alternative classes to switch to (for click-to-edit). A curated,
// extensible subset — unrecognized classes fall back to a raw display.

export interface TwParsed {
  cls: string // original class
  label: string // e.g. "Padding top"
  value: string // e.g. "10" / "flex" / "red-500"
  group: string // for ordering in the panel
  options: string[] // full class strings to switch to
  recognized: boolean
}

const SPACING = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '64', 'px']

const SPACING_SIDES: Record<string, string> = {
  p: 'Padding', px: 'Padding X', py: 'Padding Y', pt: 'Padding top', pr: 'Padding right', pb: 'Padding bottom', pl: 'Padding left',
  m: 'Margin', mx: 'Margin X', my: 'Margin Y', mt: 'Margin top', mr: 'Margin right', mb: 'Margin bottom', ml: 'Margin left',
  gap: 'Gap', 'gap-x': 'Gap X', 'gap-y': 'Gap Y',
}

// Enum utilities: the whole class is the value; options are sibling classes.
interface EnumDef {
  label: string
  group: string
  values: string[]
  prefix?: string // '' for bare (block, flex…), else e.g. 'items-'
}

const ENUMS: EnumDef[] = [
  { label: 'Display', group: 'Layout', prefix: '', values: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'hidden'] },
  { label: 'Position', group: 'Layout', prefix: '', values: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
  { label: 'Flex direction', group: 'Flex', prefix: 'flex-', values: ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'] },
  { label: 'Flex wrap', group: 'Flex', prefix: 'flex-', values: ['flex-wrap', 'flex-nowrap', 'flex-wrap-reverse'] },
  { label: 'Align items', group: 'Flex', prefix: 'items-', values: ['items-start', 'items-center', 'items-end', 'items-stretch', 'items-baseline'] },
  { label: 'Justify', group: 'Flex', prefix: 'justify-', values: ['justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly'] },
  { label: 'Text align', group: 'Text', prefix: 'text-', values: ['text-left', 'text-center', 'text-right', 'text-justify'] },
  { label: 'Font size', group: 'Text', prefix: 'text-', values: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'] },
  { label: 'Font weight', group: 'Text', prefix: 'font-', values: ['font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'] },
  { label: 'Radius', group: 'Border', prefix: 'rounded', values: ['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'] },
  { label: 'Shadow', group: 'Effects', prefix: 'shadow', values: ['shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl'] },
]

// Colors
const COLOR_FAMILIES = ['slate', 'gray', 'zinc', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const COLOR_PREFIXES: Record<string, string> = { bg: 'Background', text: 'Text color', border: 'Border color' }

function colorOptions(prefix: string): string[] {
  const opts = [`${prefix}-white`, `${prefix}-black`, `${prefix}-transparent`]
  for (const fam of COLOR_FAMILIES) for (const sh of SHADES) opts.push(`${prefix}-${fam}-${sh}`)
  return opts
}

const SIZE_VALUES = [...SPACING, 'auto', 'full', 'screen', 'min', 'max', 'fit', '1/2', '1/3', '2/3', '1/4', '3/4']

export function parseTwClass(cls: string): TwParsed {
  // Enums (exact match)
  for (const e of ENUMS) {
    if (e.values.includes(cls)) {
      return { cls, label: e.label, value: cls.replace(/^[a-z]+-/, ''), group: e.group, options: e.values, recognized: true }
    }
  }

  // Colors: bg-/text-/border- + (white|black|transparent | family-shade)
  const colorMatch = cls.match(/^(bg|text|border)-(.+)$/)
  if (colorMatch) {
    const [, prefix, rest] = colorMatch
    const isColor =
      ['white', 'black', 'transparent', 'current'].includes(rest!) ||
      /^[a-z]+-\d{2,3}$/.test(rest!) ||
      COLOR_FAMILIES.includes(rest!)
    if (isColor) {
      return { cls, label: COLOR_PREFIXES[prefix!]!, value: rest!, group: 'Color', options: colorOptions(prefix!), recognized: true }
    }
  }

  // Spacing (longest prefix first so 'px' beats 'p')
  for (const prefix of Object.keys(SPACING_SIDES).sort((a, b) => b.length - a.length)) {
    const m = cls.match(new RegExp(`^${prefix}-(.+)$`))
    if (m) {
      const scale = prefix.startsWith('m') ? [...SPACING, 'auto'] : SPACING
      return {
        cls,
        label: SPACING_SIDES[prefix]!,
        value: m[1]!,
        group: 'Spacing',
        options: scale.map((s) => `${prefix}-${s}`),
        recognized: true,
      }
    }
  }

  // Width / height
  const sizeMatch = cls.match(/^(w|h|min-w|min-h|max-w|max-h)-(.+)$/)
  if (sizeMatch) {
    const [, prefix, val] = sizeMatch
    const labels: Record<string, string> = { w: 'Width', h: 'Height', 'min-w': 'Min width', 'min-h': 'Min height', 'max-w': 'Max width', 'max-h': 'Max height' }
    return { cls, label: labels[prefix!]!, value: val!, group: 'Size', options: SIZE_VALUES.map((v) => `${prefix}-${v}`), recognized: true }
  }

  // Opacity
  const op = cls.match(/^opacity-(\d+)$/)
  if (op) {
    return { cls, label: 'Opacity', value: op[1]!, group: 'Effects', options: ['0', '5', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '90', '95', '100'].map((v) => `opacity-${v}`), recognized: true }
  }

  // z-index
  const z = cls.match(/^z-(\d+|auto)$/)
  if (z) {
    return { cls, label: 'Z-index', value: z[1]!, group: 'Layout', options: ['0', '10', '20', '30', '40', '50', 'auto'].map((v) => `z-${v}`), recognized: true }
  }

  // Unrecognized — show raw, no structured editing.
  return { cls, label: 'Class', value: cls, group: 'Other', options: [], recognized: false }
}
