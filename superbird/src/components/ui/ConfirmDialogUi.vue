<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useDialog } from '@/composables/useDialog'
import ButtonUi from './ButtonUi.vue'
import InputUi from './InputUi.vue'
import IconUi from './IconUi.vue'

const { state, accept, cancel, close } = useDialog()

const inputWrap = ref<HTMLElement | null>(null)

// Focus the input when a prompt opens.
watch(
  () => state.open,
  async (open) => {
    if (open && state.kind === 'prompt') {
      await nextTick()
      inputWrap.value?.querySelector('input')?.focus()
    }
  },
)

const pct = computed(() => {
  const p = state.progress
  return p && p.total ? Math.round((p.loaded / p.total) * 100) : 0
})

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// header icon + accent per state
const header = computed(() => {
  if (state.kind === 'process') {
    if (state.phase === 'success') return { icon: 'check-circle', chip: 'bg-green-bg text-green-fg' }
    if (state.phase === 'error') return { icon: 'alert', chip: 'bg-red-bg text-red-fg' }
    return null // busy → spinner
  }
  if (state.danger) return { icon: 'alert', chip: 'bg-red-bg text-red-fg' }
  return null
})

const showFooter = computed(() => !(state.kind === 'process' && state.phase === 'busy'))
const isSingleButton = computed(() => state.kind === 'process')

function onKeydown(e: KeyboardEvent) {
  if (!state.open) return
  if (e.key === 'Escape') {
    e.preventDefault()
    if (state.kind === 'process') {
      if (state.phase !== 'busy') close()
    } else {
      cancel()
    }
  } else if (e.key === 'Enter' && state.kind !== 'process') {
    e.preventDefault()
    accept()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function onBackdrop() {
  if (state.kind === 'process') {
    if (state.phase !== 'busy') close()
  } else {
    cancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-0 z-[105] flex items-center justify-center p-8">
      <!-- Backdrop: tint + blur ramp in and out together so it never pops -->
      <Transition
        enter-from-class="sb-backdrop-off"
        leave-to-class="sb-backdrop-off"
      >
        <div
          v-if="state.open"
          class="sb-backdrop pointer-events-auto absolute inset-0 bg-foreground/20"
          @click="onBackdrop"
        />
      </Transition>

      <!-- Panel: gentle scale + fade -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="state.open"
          class="pointer-events-auto relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-background p-6 shadow-lg"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start gap-3.5">
            <!-- busy spinner -->
            <span
              v-if="state.kind === 'process' && state.phase === 'busy'"
              class="mt-0.5 size-8 shrink-0 animate-spin rounded-full border-2 border-secondary/25 border-t-primary"
            />
            <!-- status / danger icon -->
            <span
              v-else-if="header"
              :class="['mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', header.chip]"
            >
              <IconUi :name="header.icon" size="size-4" />
            </span>

            <div class="min-w-0 flex-1">
              <h2 class="text-base font-semibold text-foreground">{{ state.title }}</h2>
              <p v-if="state.message" class="mt-1.5 text-sm leading-relaxed text-secondary whitespace-pre-line">
                {{ state.message }}
              </p>

              <!-- prompt input -->
              <div v-if="state.kind === 'prompt'" ref="inputWrap" class="mt-3">
                <InputUi v-model="state.inputValue" :placeholder="state.placeholder" size="default" @keydown.enter="accept" />
              </div>

              <!-- process progress bar -->
              <div v-if="state.kind === 'process' && state.phase === 'busy' && state.progress" class="mt-3">
                <div class="mb-1 flex items-center justify-between text-xs text-secondary">
                  <span class="font-mono">
                    {{ fmtSize(state.progress.loaded) }}<template v-if="state.progress.total"> / {{ fmtSize(state.progress.total) }}</template>
                  </span>
                  <span v-if="state.progress.total" class="font-mono">{{ pct }}%</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-secondary/15">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-150"
                    :class="!state.progress.total && 'animate-pulse'"
                    :style="{ width: state.progress.total ? `${pct}%` : '100%' }"
                  />
                </div>
              </div>

              <!-- process success link -->
              <a
                v-if="state.kind === 'process' && state.phase === 'success' && state.link"
                :href="state.link"
                target="_blank"
                rel="noopener"
                class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <IconUi name="external-link" size="size-4" /> {{ state.link }}
              </a>
            </div>
          </div>

          <div v-if="showFooter" class="mt-6 flex justify-end gap-2">
            <template v-if="isSingleButton">
              <ButtonUi @click="close">{{ state.confirmLabel }}</ButtonUi>
            </template>
            <template v-else>
              <ButtonUi variant="ghost" @click="cancel">{{ state.cancelLabel }}</ButtonUi>
              <ButtonUi :variant="state.danger ? 'danger' : 'default'" @click="accept">{{ state.confirmLabel }}</ButtonUi>
            </template>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
