import { ref, onUnmounted } from 'vue'

export function useDragScrub(
  getValue: () => { num: string; unit: string },
  onUpdate: (value: string) => void,
) {
  const isDragging = ref(false)
  let startX = 0
  let startValue = 0
  let currentUnit = 'px'

  function onPointerDown(e: PointerEvent) {
    // Only drag from the label area, not when clicking the actual input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') return

    const parsed = getValue()
    if (parsed.unit === 'auto' || parsed.unit === 'token') return

    const num = parseFloat(parsed.num)
    startValue = isNaN(num) ? 0 : num
    currentUnit = parsed.unit || 'px'
    startX = e.clientX
    isDragging.value = true

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.body.style.cursor = 'ew-resize'
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return
    const dx = e.clientX - startX

    let sensitivity = 1
    if (e.shiftKey) sensitivity = 10
    if (e.altKey) sensitivity = 0.1

    const delta = dx * sensitivity
    const next = Math.round((startValue + delta) * 100) / 100
    onUpdate(next + currentUnit)
  }

  function onPointerUp() {
    isDragging.value = false
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.body.style.cursor = ''
  }

  onUnmounted(() => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.body.style.cursor = ''
  })

  return { isDragging, onPointerDown }
}
