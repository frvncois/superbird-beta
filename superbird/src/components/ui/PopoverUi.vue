<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'

type PopoverAlign = 'left' | 'right' | 'full'
type PopoverTransition = 'slide' | 'scale'

const props = withDefaults(
  defineProps<{
    align?: PopoverAlign
    panelClass?: string
    // 'slide' (default) or 'scale' (origin-top zoom, used by the select dropdowns).
    transition?: PopoverTransition
    // Render the fixed click-away backdrop. Turn OFF for focus-driven popovers
    // (e.g. type-in-place inputs) where a backdrop would block the field.
    backdrop?: boolean
  }>(),
  {
    align: 'left',
    panelClass: 'p-1',
    transition: 'slide',
    backdrop: true,
  },
)

const open = defineModel<boolean>('open', { default: false })

// The panel is teleported to <body> and positioned `fixed` from the trigger's
// rect, so it's never clipped by a scrollable/overflow ancestor (e.g. the
// sidebar panels) and always stacks above the canvas.
const anchor = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

function measure() {
  const wrap = anchor.value?.parentElement
  if (!wrap) return
  const r = wrap.getBoundingClientRect()
  const s: Record<string, string> = { position: 'fixed', top: `${r.bottom + 4}px` }
  if (props.align === 'full') {
    s.left = `${r.left}px`
    s.width = `${r.width}px`
  } else if (props.align === 'right') {
    s.right = `${Math.max(0, window.innerWidth - r.right)}px`
  } else {
    s.left = `${r.left}px`
  }
  panelStyle.value = s
}

function onReposition() {
  if (open.value) measure()
}

watch(open, async (v) => {
  if (v) {
    await nextTick()
    measure()
    // `capture` so we catch scrolling of any ancestor (the sidebar panel).
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
  } else {
    window.removeEventListener('scroll', onReposition, true)
    window.removeEventListener('resize', onReposition)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})

const tx = computed(() =>
  props.transition === 'scale'
    ? {
        active: 'transition duration-150 ease-out',
        activeLeave: 'transition duration-100 ease-in',
        from: 'opacity-0 -translate-y-1 scale-[0.98]',
        to: 'opacity-100 translate-y-0 scale-100',
      }
    : {
        active: 'transition duration-150 ease-out',
        activeLeave: 'transition duration-100 ease-in',
        from: 'opacity-0 translate-y-1',
        to: 'opacity-100 translate-y-0',
      },
)
</script>

<!--
  Anchored popover: render inside the trigger's wrapper. The panel teleports to
  <body> (fixed-positioned from the trigger) so overflow ancestors can't clip it
  and it always sits above the canvas.
-->
<template>
  <!-- Inline zero-size anchor: its parent is the trigger wrapper we measure. -->
  <span ref="anchor" aria-hidden="true" class="hidden" />

  <Teleport to="body">
    <div v-if="open && backdrop" class="fixed inset-0 z-[84]" @click="open = false" />
    <Transition
      :enter-active-class="tx.active"
      :enter-from-class="tx.from"
      :enter-to-class="tx.to"
      :leave-active-class="tx.activeLeave"
      :leave-from-class="tx.to"
      :leave-to-class="tx.from"
    >
      <div
        v-if="open"
        :style="panelStyle"
        :class="['z-[85] origin-top rounded-xl border bg-background shadow-lg', panelClass]"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
