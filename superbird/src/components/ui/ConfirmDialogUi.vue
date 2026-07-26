<script setup lang="ts">
import ModalUi from './ModalUi.vue'
import ButtonUi from './ButtonUi.vue'

// The standard confirm/cancel dialog — a thin wrapper over `ModalUi
// variant="dialog"` that supplies the Cancel + Confirm footer every destructive
// action used to hand-roll. Drive `open` from local ref state (there is
// deliberately no imperative dialog service) and listen to `@confirm`.
// Optional default slot renders extra body content above the actions.
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    busy?: boolean
    icon?: string
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: true, busy: false, icon: 'alert' },
)

const open = defineModel<boolean>('open', { default: false })
defineEmits<{ confirm: [] }>()
</script>

<template>
  <ModalUi
    v-model:open="open"
    variant="dialog"
    :danger="danger"
    :icon="icon"
    :title="title"
    :description="description"
  >
    <slot />
    <template #actions>
      <ButtonUi variant="ghost" @click="open = false">{{ cancelLabel }}</ButtonUi>
      <ButtonUi :variant="danger ? 'danger' : 'default'" :disabled="busy" @click="$emit('confirm')">{{ confirmLabel }}</ButtonUi>
    </template>
  </ModalUi>
</template>
