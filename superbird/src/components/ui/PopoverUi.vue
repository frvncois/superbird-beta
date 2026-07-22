<script setup lang="ts">
import { computed } from 'vue'

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

const alignClasses: Record<PopoverAlign, string> = {
  left: 'left-0',
  right: 'right-0',
  full: 'left-0 right-0',
}

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
  Anchored popover: render inside a `relative` container. Provides the (optional)
  click-away backdrop, panel shell and a slide/scale transition.
-->
<template>
  <div v-if="open && backdrop" class="fixed inset-0 z-40" @click="open = false" />
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
      :class="[
        'absolute top-full z-50 mt-1 origin-top rounded-xl border bg-background shadow-lg',
        alignClasses[props.align],
        panelClass,
      ]"
    >
      <slot />
    </div>
  </Transition>
</template>
