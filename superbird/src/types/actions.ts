export interface ContextMenuAction {
  id: string
  label: string
  icon?: string
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  handler: () => void
}

export interface ContextMenuSeparator {
  type: 'separator'
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator

export function separator(): ContextMenuSeparator {
  return { type: 'separator' }
}

export function isSeparator(item: ContextMenuItem): item is ContextMenuSeparator {
  return 'type' in item && item.type === 'separator'
}

export function filterMenuItems(items: ContextMenuItem[]): ContextMenuItem[] {
  return items
    .filter((item) => !('hidden' in item && item.hidden))
    // Remove leading/trailing/consecutive separators
    .reduce<ContextMenuItem[]>((acc, item, i, arr) => {
      if (isSeparator(item)) {
        if (i === 0 || i === arr.length - 1) return acc
        if (acc.length > 0 && isSeparator(acc[acc.length - 1]!)) return acc
      }
      acc.push(item)
      return acc
    }, [])
}
