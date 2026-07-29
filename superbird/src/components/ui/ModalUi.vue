<script setup lang="ts">
import { computed, onBeforeUnmount, useSlots, watch } from 'vue'
import { registerOverlay } from '@/composables/useOverlayStack'
import IconUi from './IconUi.vue'
import IconButtonUi from './IconButtonUi.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    variant?: 'modal' | 'dialog'
    position?: 'center' | 'right'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    panelClass?: string
    bodyClass?: string
    closable?: boolean
    dismissible?: boolean
    danger?: boolean
  }>(),
  {
    variant: 'modal',
    position: 'center',
    size: 'md',
    panelClass: '',
    bodyClass: '',
    closable: undefined,
    dismissible: true,
    danger: false,
  },
)

const open = defineModel<boolean>('open', { default: false })
const slots = useSlots()

const isDialog = computed(() => props.variant === 'dialog')
const isDrawer = computed(() => props.position === 'right')
const showClose = computed(() => props.closable ?? props.variant === 'modal')

const hasHeader = computed(
  () =>
    !!(
      slots.header ||
      props.title ||
      props.description ||
      props.icon ||
      slots.icon ||
      slots['header-action'] ||
      showClose.value
    ),
)

const sizeClass = computed(() => {
  if (isDrawer.value) return 'h-full'
  return { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-5xl' }[props.size]
})

const contentClass = computed(
  () => props.bodyClass || `min-h-0 flex-1 overflow-auto ${isDialog.value ? 'px-6 py-4' : 'p-4'}`,
)

const panelTransition = computed(() =>
  isDrawer.value
    ? {
        enterActiveClass: 'transition duration-250 ease-out',
        enterFromClass: 'translate-x-full',
        enterToClass: 'translate-x-0',
        leaveActiveClass: 'transition duration-200 ease-in',
        leaveFromClass: 'translate-x-0',
        leaveToClass: 'translate-x-full',
      }
    : {
        enterActiveClass: 'transition duration-200 ease-out',
        enterFromClass: 'opacity-0 scale-95',
        enterToClass: 'opacity-100 scale-100',
        leaveActiveClass: 'transition duration-150 ease-in',
        leaveFromClass: 'opacity-100 scale-100',
        leaveToClass: 'opacity-0 scale-95',
      },
)

function dismiss() {
  if (props.dismissible) open.value = false
}

let release: (() => void) | null = null
watch(
  open,
  (isOpen) => {
    if (isOpen && !release) release = registerOverlay(isDialog.value ? 'dialog' : 'modal', dismiss)
    if (!isOpen && release) {
      release()
      release = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  release?.()
  release = null
})
</script>

<template>
  <Teleport defer :to="isDialog ? '#overlay-dialogs' : '#overlay-modals'">
    <Transition v-bind="panelTransition">
      <div
        v-if="open"
        class="pointer-events-none absolute inset-0 flex"
        :class="isDrawer ? 'justify-end' : 'items-center justify-center p-8'"
      >
        <div
          role="dialog"
          aria-modal="true"
          :class="[
            'pointer-events-auto relative flex max-h-2xl w-full flex-col overflow-hidden bg-background shadow-lg',
            isDrawer ? 'h-full' : 'rounded-2xl',
            sizeClass,
            panelClass,
          ]"
        >
          <header
            v-if="hasHeader"
            :class="isDialog ? 'flex items-start gap-3.5 p-6 pb-0' : 'flex items-center gap-3 border-b p-4'"
          >
            <slot name="header">
              <span
                v-if="isDialog && (icon || slots.icon)"
                class="flex size-9 shrink-0 items-center justify-center rounded-full"
                :class="danger ? 'bg-red-bg text-red-fg' : 'bg-foreground text-background'"
              >
                <slot name="icon"><IconUi v-if="icon" :name="icon" size="size-4" /></slot>
              </span>
              <IconUi v-else-if="icon" :name="icon" size="size-4" class="shrink-0 text-secondary" />

              <div class="min-w-0 flex-1">
                <h2 v-if="title" class="truncate font-semibold text-foreground" :class="isDialog ? 'text-base' : 'text-sm'">
                  {{ title }}
                </h2>
                <p v-if="description" class="whitespace-pre-line text-secondary" :class="isDialog ? 'mt-1 text-sm' : 'text-xs'">{{ description }}</p>
              </div>

              <div v-if="slots['header-action']" class="flex shrink-0 items-center">
                <slot name="header-action" />
              </div>
              <IconButtonUi v-if="showClose" title="Close" class="shrink-0" @click="open = false">
                <IconUi name="close" size="size-4" />
              </IconButtonUi>
            </slot>
          </header>

          <div :class="contentClass">
            <slot />
          </div>

          <footer
            v-if="slots.actions"
            :class="
              isDialog ? 'flex items-center justify-end gap-2 p-6 pt-0' : 'flex items-center justify-end gap-2 border-t p-4'
            "
          >
            <slot name="actions" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
