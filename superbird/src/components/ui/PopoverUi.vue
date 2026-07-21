<script setup lang="ts">
type PopoverAlign = 'left' | 'right' | 'full'

const props = withDefaults(
  defineProps<{
    align?: PopoverAlign
    panelClass?: string
  }>(),
  {
    align: 'left',
    panelClass: 'p-1',
  },
)

const open = defineModel<boolean>('open', { default: false })

const alignClasses: Record<PopoverAlign, string> = {
  left: 'left-0',
  right: 'right-0',
  full: 'left-0 right-0',
}
</script>

<!--
  Anchored popover: render inside a `relative` container. Provides the
  click-away backdrop, panel shell and the standard slide-fade transition.
-->
<template>
  <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-1"
  >
    <div
      v-if="open"
      :class="[
        'absolute top-full z-50 mt-1 rounded-xl border bg-background shadow-lg',
        alignClasses[props.align],
        panelClass,
      ]"
    >
      <slot />
    </div>
  </Transition>
</template>
