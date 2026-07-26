<script setup lang="ts">
import { computed } from 'vue'
import ModalUi from './ModalUi.vue'
import ButtonUi from './ButtonUi.vue'
import IconUi from './IconUi.vue'

// A busy → success/error status dialog (spinner while working, a coloured chip +
// dismiss button when done). Driven by local reactive state; the default slot
// takes phase-specific extras (a success link, a progress bar) and receives
// `{ busy }`. Replaces the hand-rolled copies in AppHeader (publish) and
// BackupPanel (backup/restore/import).
const props = withDefaults(
  defineProps<{
    open: boolean
    phase: 'busy' | 'success' | 'error'
    title: string
    message?: string
    confirmLabel?: string
  }>(),
  { confirmLabel: 'Done' },
)

const emit = defineEmits<{ close: [] }>()

const busy = computed(() => props.phase === 'busy')
const chip = computed(() =>
  props.phase === 'success'
    ? { icon: 'check-circle', class: 'bg-green-bg text-green-fg' }
    : props.phase === 'error'
      ? { icon: 'alert', class: 'bg-red-bg text-red-fg' }
      : null,
)
</script>

<template>
  <ModalUi
    :open="open"
    variant="dialog"
    :closable="false"
    :dismissible="!busy"
    @update:open="(v: boolean) => { if (!v) emit('close') }"
  >
    <template #header>
      <span
        v-if="busy"
        class="size-9 shrink-0 animate-spin rounded-full border-2 border-secondary/25 border-t-primary"
      />
      <span
        v-else-if="chip"
        :class="['flex size-9 shrink-0 items-center justify-center rounded-full', chip.class]"
      >
        <IconUi :name="chip.icon" size="size-4" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-semibold text-foreground">{{ title }}</h2>
      </div>
    </template>

    <div class="space-y-3">
      <p v-if="message" class="whitespace-pre-line text-sm leading-relaxed text-secondary">{{ message }}</p>
      <slot :busy="busy" />
    </div>

    <template v-if="!busy" #actions>
      <ButtonUi @click="emit('close')">{{ confirmLabel }}</ButtonUi>
    </template>
  </ModalUi>
</template>
