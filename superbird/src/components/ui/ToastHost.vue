<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast'
import IconUi from './IconUi.vue'
import ButtonUi from './ButtonUi.vue'

const { toasts, dismiss, runAction } = useToast()

const STYLES: Record<ToastType, { icon: string; chip: string }> = {
  success: { icon: 'check-circle', chip: 'bg-green-bg text-green-fg' },
  error: { icon: 'alert', chip: 'bg-red-bg text-red-fg' },
  info: { icon: 'info', chip: 'bg-blue-bg text-blue-fg' },
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      class="pointer-events-none fixed bottom-4 right-4 z-[110] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-x-4 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-150 ease-in absolute w-full"
      leave-from-class="opacity-100"
      leave-to-class="translate-x-4 opacity-0"
      move-class="transition-transform duration-200"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-background px-3.5 py-3 shadow-lg"
      >
        <span :class="['flex size-6 shrink-0 items-center justify-center rounded-full', STYLES[t.type].chip]">
          <IconUi :name="STYLES[t.type].icon" size="size-3.5" />
        </span>

        <p class="min-w-0 flex-1 pt-0.5 text-sm text-foreground">{{ t.message }}</p>

        <ButtonUi v-if="t.action" variant="ghost" size="sm" tone="primary" class="shrink-0" @click="runAction(t)">
          {{ t.action.label }}
        </ButtonUi>

        <ButtonUi variant="ghost" size="sm" square icon="close" aria-label="Dismiss" class="shrink-0" @click="dismiss(t.id)" />
      </div>
    </TransitionGroup>
  </Teleport>
</template>
