<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { overlayStack, dismissTop, dismissTopmost, type OverlayLayer } from '@/composables/useOverlayStack'

const layers: { key: OverlayLayer; z: string; outlet: string }[] = [
  { key: 'modal', z: 'z-[100]', outlet: 'overlay-modals' },
  { key: 'dialog', z: 'z-[105]', outlet: 'overlay-dialogs' },
]

const openByLayer = computed<Record<OverlayLayer, boolean>>(() => ({
  modal: overlayStack.some((e) => e.layer === 'modal'),
  dialog: overlayStack.some((e) => e.layer === 'dialog'),
}))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && overlayStack.length) dismissTopmost()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    v-for="layer in layers"
    :key="layer.key"
    class="pointer-events-none fixed inset-0"
    :class="layer.z"
  >
    <Transition
      enter-from-class="opacity-0 [--sb-backdrop-blur:0px]"
      leave-to-class="opacity-0 [--sb-backdrop-blur:0px]"
    >
      <div
        v-if="openByLayer[layer.key]"
        class="pointer-events-auto absolute inset-0 bg-foreground/20 [--sb-backdrop-blur:4px] [backdrop-filter:blur(var(--sb-backdrop-blur))] [-webkit-backdrop-filter:blur(var(--sb-backdrop-blur))] [transition:opacity_300ms_ease-out,backdrop-filter_300ms_ease-out,-webkit-backdrop-filter_300ms_ease-out]"
        @click="dismissTop(layer.key)"
      />
    </Transition>

    <div :id="layer.outlet" class="absolute inset-0" />
  </div>
</template>
