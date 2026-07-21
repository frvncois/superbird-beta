import { ref, type Ref } from 'vue'
import { filterMenuItems, type ContextMenuItem } from '@/types/contextMenu'

export function useContextMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const items: Ref<ContextMenuItem[]> = ref([])

  function open(event: MouseEvent, menuItems: ContextMenuItem[]) {
    event.preventDefault()
    event.stopPropagation()
    x.value = event.clientX
    y.value = event.clientY
    items.value = filterMenuItems(menuItems)
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, x, y, items, open, close }
}
