// Auto-hide scrollbars: reveal a scrollable area's scrollbar only while it is
// actively scrolling. On each scroll we tag the scrolled element with
// `is-scrolling` (CSS in main.css colours the thumb) and clear the tag after a
// short idle delay so the bar fades back out. One global, capturing, passive
// listener covers every scroll area (sidebars, canvas, panels, modals) without
// any per-component wiring.
const IDLE_MS = 700
const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>()

function onScroll(e: Event) {
  const target = e.target
  // Document/window scroll reports `document` as the target; the scrollbar there
  // lives on <html>.
  const el = target === document ? document.documentElement : (target as Element | null)
  if (!(el instanceof Element)) return

  el.classList.add('is-scrolling')
  const prev = timers.get(el)
  if (prev) clearTimeout(prev)
  timers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), IDLE_MS))
}

export function initAutoHideScrollbars() {
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
}
