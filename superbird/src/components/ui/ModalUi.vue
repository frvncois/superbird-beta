<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    position?: 'center' | 'right'
    panelClass?: string
  }>(),
  {
    position: 'center',
    panelClass: '',
  },
)

const open = defineModel<boolean>('open', { default: false })

// Panel entrance: center = gentle scale/fade; right = slide-in drawer.
const panelTransition = computed(() =>
  props.position === 'right'
    ? {
        enter: 'transition duration-250 ease-out',
        enterFrom: 'translate-x-full',
        enterTo: 'translate-x-0',
        leave: 'transition duration-200 ease-in',
        leaveFrom: 'translate-x-0',
        leaveTo: 'translate-x-full',
      }
    : {
        enter: 'transition duration-200 ease-out',
        enterFrom: 'opacity-0 scale-95',
        enterTo: 'opacity-100 scale-100',
        leave: 'transition duration-150 ease-in',
        leaveFrom: 'opacity-100 scale-100',
        leaveTo: 'opacity-0 scale-95',
      },
)
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-0 z-[100] flex"
      :class="position === 'right' ? 'justify-end' : 'items-center justify-center p-8'"
    >
      <!-- Backdrop: tint + blur ramp in and out together so it never pops -->
      <Transition
        enter-from-class="sb-backdrop-off"
        leave-to-class="sb-backdrop-off"
      >
        <div
          v-if="open"
          class="sb-backdrop pointer-events-auto absolute inset-0 bg-foreground/20"
          @click="open = false"
        />
      </Transition>

      <!-- Panel -->
      <Transition
        :enter-active-class="panelTransition.enter"
        :enter-from-class="panelTransition.enterFrom"
        :enter-to-class="panelTransition.enterTo"
        :leave-active-class="panelTransition.leave"
        :leave-from-class="panelTransition.leaveFrom"
        :leave-to-class="panelTransition.leaveTo"
      >
        <div
          v-if="open"
          :class="[
            'pointer-events-auto relative z-10 flex flex-col overflow-hidden border bg-background shadow-lg',
            position === 'right' ? 'h-full' : 'rounded-2xl',
            panelClass,
          ]"
        >
          <slot />
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
