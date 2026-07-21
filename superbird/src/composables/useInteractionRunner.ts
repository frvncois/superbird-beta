import { watch, onUnmounted, type Ref } from 'vue'
import type { Interaction } from '@/types/canvas'
import { runAllSteps, runStepsReverse } from '@/lib/animations'

export function useInteractionRunner(
  elRef: Ref<HTMLElement | null>,
  interactions: Ref<Interaction[] | undefined>,
) {
  const cleanups: (() => void)[] = []
  let activeAnimations: Animation[] = []

  function cancelActive() {
    activeAnimations.forEach((a) => { a.cancel() })
    activeAnimations = []
  }

  function attach() {
    detach()
    const el = elRef.value
    const ixList = interactions.value
    if (!el || !ixList || ixList.length === 0) return

    for (const ix of ixList) {
      if (ix.steps.length === 0) continue

      switch (ix.trigger) {
        case 'page-load': {
          const anims = runAllSteps(el, ix)
          activeAnimations.push(...anims)

          if (ix.options.loop) {
            const totalDuration = Math.max(
              ...ix.steps.map((s) => s.delay + s.duration),
            )
            const interval = setInterval(() => {
              cancelActive()
              activeAnimations.push(...runAllSteps(el, ix))
            }, totalDuration + 100)
            cleanups.push(() => clearInterval(interval))
          }
          break
        }

        case 'click': {
          let toggled = false
          const handler = () => {
            cancelActive()
            if (toggled) {
              activeAnimations = runStepsReverse(el, ix.steps)
            } else {
              activeAnimations = runAllSteps(el, ix)
            }
            toggled = !toggled
          }
          el.addEventListener('click', handler, true)
          cleanups.push(() => el.removeEventListener('click', handler, true))
          break
        }

        case 'hover': {
          const enterHandler = () => {
            cancelActive()
            activeAnimations = runAllSteps(el, ix)
          }
          const leaveHandler = () => {
            if (ix.options.resetOnExit) {
              cancelActive()
              activeAnimations = runStepsReverse(el, ix.steps)
            }
          }
          el.addEventListener('mouseenter', enterHandler)
          el.addEventListener('mouseleave', leaveHandler)
          cleanups.push(() => {
            el.removeEventListener('mouseenter', enterHandler)
            el.removeEventListener('mouseleave', leaveHandler)
          })
          break
        }

        case 'scroll-into-view': {
          const observer = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  cancelActive()
                  activeAnimations = runAllSteps(el, ix)
                } else if (ix.options.resetOnExit) {
                  cancelActive()
                  activeAnimations = runStepsReverse(el, ix.steps)
                }
              }
            },
            { threshold: 0.1 },
          )
          observer.observe(el)
          cleanups.push(() => observer.disconnect())
          break
        }

        case 'scroll-position': {
          // Simplified: maps scroll progress 0-1 to animation progress
          const canvasEl = el.closest('.h-full.overflow-auto')
          if (!canvasEl) break

          const anims = runAllSteps(el, ix)
          anims.forEach((a) => a.pause())
          activeAnimations.push(...anims)

          const scrollHandler = () => {
            const rect = el.getBoundingClientRect()
            const viewH = canvasEl.clientHeight
            const progress = Math.max(0, Math.min(1, 1 - (rect.top / viewH)))
            anims.forEach((a) => {
              if (a.effect) {
                const timing = a.effect.getComputedTiming()
                const duration = (timing.duration as number) ?? 300
                a.currentTime = progress * duration
              }
            })
          }
          canvasEl.addEventListener('scroll', scrollHandler, { passive: true })
          cleanups.push(() => canvasEl.removeEventListener('scroll', scrollHandler))
          break
        }

        // class-change not implemented in preview
      }
    }
  }

  function detach() {
    cancelActive()
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  }

  watch([elRef, interactions], () => attach(), { immediate: true, deep: true })
  onUnmounted(detach)
}
