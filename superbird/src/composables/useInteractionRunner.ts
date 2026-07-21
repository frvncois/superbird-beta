import { watch, onUnmounted, type Ref } from 'vue'
import type { Interaction, InteractionStep, InteractionAction, ActionProperty } from '@/types/canvas'

// Maps our action properties to CSS
function buildKeyframes(actions: InteractionAction[]): { from: Record<string, string>; to: Record<string, string> } {
  const from: Record<string, string> = {}
  const to: Record<string, string> = {}

  const transformFrom: string[] = []
  const transformTo: string[] = []
  const filterFrom: string[] = []
  const filterTo: string[] = []

  for (const action of actions) {
    if (isTransformProp(action.property)) {
      transformFrom.push(toTransformValue(action.property, action.from))
      transformTo.push(toTransformValue(action.property, action.to))
    } else if (isFilterProp(action.property)) {
      filterFrom.push(toFilterValue(action.property, action.from))
      filterTo.push(toFilterValue(action.property, action.to))
    } else {
      const cssProp = toCssProp(action.property)
      from[cssProp] = action.from
      to[cssProp] = action.to
    }
  }

  if (transformFrom.length > 0) {
    from.transform = transformFrom.join(' ')
    to.transform = transformTo.join(' ')
  }
  if (filterFrom.length > 0) {
    from.filter = filterFrom.join(' ')
    to.filter = filterTo.join(' ')
  }

  return { from, to }
}

function isTransformProp(p: ActionProperty): boolean {
  return ['translateX', 'translateY', 'translateZ', 'scaleX', 'scaleY', 'rotateX', 'rotateY', 'rotateZ'].includes(p)
}

function isFilterProp(p: ActionProperty): boolean {
  return ['blur', 'brightness', 'contrast', 'saturate'].includes(p)
}

function toTransformValue(prop: ActionProperty, value: string): string {
  switch (prop) {
    case 'translateX': return `translateX(${ensureUnit(value, 'px')})`
    case 'translateY': return `translateY(${ensureUnit(value, 'px')})`
    case 'translateZ': return `translateZ(${ensureUnit(value, 'px')})`
    case 'scaleX': return `scaleX(${value})`
    case 'scaleY': return `scaleY(${value})`
    case 'rotateX': return `rotateX(${ensureUnit(value, 'deg')})`
    case 'rotateY': return `rotateY(${ensureUnit(value, 'deg')})`
    case 'rotateZ': return `rotateZ(${ensureUnit(value, 'deg')})`
    default: return ''
  }
}

function toFilterValue(prop: ActionProperty, value: string): string {
  switch (prop) {
    case 'blur': return `blur(${ensureUnit(value, 'px')})`
    case 'brightness': return `brightness(${value})`
    case 'contrast': return `contrast(${value})`
    case 'saturate': return `saturate(${value})`
    default: return ''
  }
}

function toCssProp(prop: ActionProperty): string {
  switch (prop) {
    case 'background-color': return 'backgroundColor'
    case 'color': return 'color'
    case 'opacity': return 'opacity'
    case 'width': return 'width'
    case 'height': return 'height'
    default: return prop
  }
}

function ensureUnit(value: string, unit: string): string {
  if (!value) return `0${unit}`
  const num = parseFloat(value)
  if (isNaN(num)) return value
  if (value.match(/[a-z%]+$/i)) return value
  return `${value}${unit}`
}

function resolveTargets(triggerEl: HTMLElement, step: InteractionStep): HTMLElement[] {
  const { type, value } = step.target

  switch (type) {
    case 'self':
      return [triggerEl]
    case 'children':
      return Array.from(triggerEl.children) as HTMLElement[]
    case 'child': {
      if (!value) return []
      const children = Array.from(triggerEl.querySelectorAll('.canvas-node')) as HTMLElement[]
      return children.slice(0, 1)
    }
    case 'sibling': {
      if (!triggerEl.parentElement) return []
      return Array.from(triggerEl.parentElement.children).filter(
        (el) => el !== triggerEl && el instanceof HTMLElement,
      ) as HTMLElement[]
    }
    case 'parent':
      return triggerEl.parentElement ? [triggerEl.parentElement] : []
    case 'class': {
      if (!value) return []
      const selector = value.startsWith('.') ? value : `.${value}`
      return Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    }
    case 'id': {
      if (!value) return []
      const id = value.startsWith('#') ? value.slice(1) : value
      const el = document.getElementById(id)
      return el ? [el] : []
    }
    default:
      return [triggerEl]
  }
}

function runStep(triggerEl: HTMLElement, step: InteractionStep): Animation[] {
  const targets = resolveTargets(triggerEl, step)
  if (targets.length === 0 || step.actions.length === 0) return []

  const { from, to } = buildKeyframes(step.actions)
  const animations: Animation[] = []

  targets.forEach((target, i) => {
    const staggerDelay = (step.stagger ?? 0) * i
    const anim = target.animate(
      [from, to],
      {
        delay: step.delay + staggerDelay,
        duration: step.duration,
        easing: step.easing,
        fill: 'forwards',
      },
    )
    animations.push(anim)
  })

  return animations
}

function runStepsReverse(triggerEl: HTMLElement, steps: InteractionStep[]): Animation[] {
  const allAnims: Animation[] = []
  for (const step of steps) {
    const targets = resolveTargets(triggerEl, step)
    if (targets.length === 0 || step.actions.length === 0) continue

    const { from, to } = buildKeyframes(step.actions)
    targets.forEach((target, i) => {
      const staggerDelay = (step.stagger ?? 0) * i
      const anim = target.animate(
        [to, from],
        {
          delay: step.delay + staggerDelay,
          duration: step.duration,
          easing: step.easing,
          fill: 'forwards',
        },
      )
      allAnims.push(anim)
    })
  }
  return allAnims
}

function runAllSteps(triggerEl: HTMLElement, ix: Interaction): Animation[] {
  const allAnims: Animation[] = []
  for (const step of ix.steps) {
    allAnims.push(...runStep(triggerEl, step))
  }
  return allAnims
}

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
