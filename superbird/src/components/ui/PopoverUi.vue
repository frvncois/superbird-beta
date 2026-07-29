<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'

type PopoverAlign = 'left' | 'right' | 'full'
type PopoverTransition = 'slide' | 'scale'

const props = withDefaults(
  defineProps<{
    align?: PopoverAlign
    panelClass?: string
    transition?: PopoverTransition
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

<template>
  <span ref="anchor" aria-hidden="true" class="hidden" />

  <Teleport to="body">
    <div v-if="open && backdrop" class="fixed inset-0 z-[101]" @click="open = false" />
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
        :class="['z-[102] origin-top rounded-xl bg-background shadow-lg', panelClass]"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
