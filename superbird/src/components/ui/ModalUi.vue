<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useSlots } from 'vue'
import IconUi from './IconUi.vue'
import IconButtonUi from './IconButtonUi.vue'

// Overlay surface with three regions — Header, Content (default slot), Actions —
// mirroring CardUi. Two variants:
//   • 'modal'  — larger panel, title-bar header with a close (X), bordered
//                regions; supports a right-side drawer via `position`.
//   • 'dialog' — compact centered panel, icon-chip header + description, footer
//                buttons (confirm/cancel), no close (X).
// The header can be fully overridden with a `#header` slot; otherwise it's built
// from `title` / `description` / `icon` (or an `#icon` slot) like CardUi.
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    variant?: 'modal' | 'dialog'
    // Centered panel, or a right-side drawer (modal variant).
    position?: 'center' | 'right'
    // Max-width preset for a centered panel.
    size?: 'sm' | 'md' | 'lg' | 'xl'
    panelClass?: string
    // Content region padding/scroll override.
    bodyClass?: string
    // Show the header close (X). Defaults: modal → true, dialog → false.
    closable?: boolean
    // Backdrop click / Escape dismiss.
    dismissible?: boolean
    // Dialog variant: render the icon chip in the red danger tone.
    danger?: boolean
  }>(),
  {
    variant: 'modal',
    position: 'center',
    size: 'md',
    panelClass: '',
    bodyClass: '',
    // undefined (not false) so an absent `closable` isn't boolean-coerced to
    // false — that would defeat the `?? variant === 'modal'` default below.
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

// Content region styling. `bodyClass` replaces the default entirely (like CardUi)
// so callers can drop the padding/scroll and lay the body out themselves.
const contentClass = computed(
  () => props.bodyClass || `min-h-0 flex-1 overflow-auto ${isDialog.value ? 'px-6 py-4' : 'p-4'}`,
)

// Panel entrance: center = gentle scale/fade; right = slide-in drawer.
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
function onKeydown(e: KeyboardEvent) {
  if (open.value && e.key === 'Escape') dismiss()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-0 flex"
      :class="[isDialog ? 'z-[105]' : 'z-[100]', isDrawer ? 'justify-end' : 'items-center justify-center p-8']"
    >
      <!-- Backdrop: tint + blur ramp in and out together so it never pops.
           Explicit backdrop-filter (not `backdrop-blur-*`, whose composed var
           collapses when transition classes are stripped) so blur ramps on
           enter/leave AND persists while open. -->
      <Transition
        enter-from-class="opacity-0 [--sb-backdrop-blur:0px]"
        leave-to-class="opacity-0 [--sb-backdrop-blur:0px]"
      >
        <div
          v-if="open"
          class="pointer-events-auto absolute inset-0 bg-foreground/20 [--sb-backdrop-blur:4px] [backdrop-filter:blur(var(--sb-backdrop-blur))] [-webkit-backdrop-filter:blur(var(--sb-backdrop-blur))] [transition:opacity_300ms_ease-out,backdrop-filter_300ms_ease-out,-webkit-backdrop-filter_300ms_ease-out]"
          @click="dismiss"
        />
      </Transition>

      <!-- Panel -->
      <Transition v-bind="panelTransition">
        <div
          v-if="open"
          role="dialog"
          aria-modal="true"
          :class="[
            'pointer-events-auto relative z-10 flex max-h-2xl w-full flex-col overflow-hidden bg-background shadow-lg',
            isDrawer ? 'h-full' : 'rounded-2xl',
            sizeClass,
            panelClass,
          ]"
        >
          <!-- Header -->
          <header
            v-if="hasHeader"
            :class="isDialog ? 'flex items-start gap-3.5 p-6 pb-0' : 'flex items-center gap-3 border-b p-4'"
          >
            <slot name="header">
              <!-- Dialog → icon chip; modal → inline icon -->
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

          <!-- Content -->
          <div :class="contentClass">
            <slot />
          </div>

          <!-- Actions -->
          <footer
            v-if="slots.actions"
            :class="
              isDialog ? 'flex items-center justify-end gap-2 p-6 pt-0' : 'flex items-center justify-end gap-2 border-t p-4'
            "
          >
            <slot name="actions" />
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
