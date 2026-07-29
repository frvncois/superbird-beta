<script setup lang="ts">
import ModalUi from './ModalUi.vue'
import ButtonUi from './ButtonUi.vue'

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
