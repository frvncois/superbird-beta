<script setup lang="ts">
withDefaults(
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
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        :class="[
          'fixed inset-0 z-[100] flex',
          position === 'right' ? 'justify-end' : 'items-center justify-center p-8',
        ]"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-foreground/20 backdrop-blur-sm" @click="open = false" />

        <!-- Panel -->
        <div
          :class="[
            'relative z-10 flex flex-col overflow-hidden border bg-background shadow-lg',
            position === 'right' ? 'h-full' : 'rounded-2xl',
            panelClass,
          ]"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
