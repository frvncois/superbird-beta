<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import { useProjectPersistence } from '@/composables/useProjectPersistence'

// Publish flow with a 5s "you can still cancel" grace period before anything
// actually goes live: countdown → publishing → success (view live) / error.
const open = defineModel<boolean>('open', { default: false })

type Phase = 'countdown' | 'publishing' | 'success' | 'error'
const phase = ref<Phase>('countdown')
const errorMessage = ref('')

const COUNTDOWN = 5
const RING_R = 34

const liveUrl = computed(() => window.location.origin + '/')

// Backdrop / Escape may dismiss except mid-publish (the request is in flight).
const dismissible = computed(() => phase.value !== 'publishing')

let timer: ReturnType<typeof setTimeout> | null = null
function stopTimer() {
  if (timer) { clearTimeout(timer); timer = null }
}

function startCountdown() {
  stopTimer()
  phase.value = 'countdown'
  errorMessage.value = ''
  // The ring fill is a pure CSS animation (runs on mount); publish when it ends.
  timer = setTimeout(() => void runPublish(), COUNTDOWN * 1000)
}

async function runPublish() {
  phase.value = 'publishing'
  try {
    await useProjectPersistence().publish()
    phase.value = 'success'
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
    phase.value = 'error'
  }
}

function cancel() {
  stopTimer()
  open.value = false
}

function viewLive() {
  window.open(liveUrl.value, '_blank', 'noopener')
}

// Reset the flow each time the dialog opens; clean up timers when it closes.
watch(open, (isOpen) => {
  if (isOpen) startCountdown()
  else stopTimer()
})
onBeforeUnmount(stopTimer)
</script>

<template>
  <ModalUi
    v-model:open="open"
    variant="dialog"
    size="sm"
    :closable="false"
    :dismissible="dismissible"
    body-class="p-0"
  >
    <!-- Fixed min-height keeps the panel stable so phase swaps don't jump. -->
    <div class="flex min-h-[19rem] flex-col items-center justify-center gap-6 px-8 py-9 text-center">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-[var(--ease-spring)]"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-150 ease-[var(--ease-exit)]"
        leave-to-class="opacity-0 scale-95"
      >
        <!-- ── Countdown ── -->
        <div v-if="phase === 'countdown'" key="countdown" class="flex flex-col items-center gap-6">
          <div class="relative size-28">
            <svg viewBox="0 0 80 80" class="size-28 -rotate-90">
              <circle cx="40" cy="40" :r="RING_R" fill="none" stroke-width="5" class="stroke-foreground/10" />
              <circle
                cx="40"
                cy="40"
                :r="RING_R"
                fill="none"
                stroke-width="5"
                stroke-linecap="round"
                class="stroke-primary"
                pathLength="1"
                stroke-dasharray="1"
                :style="{ animation: `superbird-ring-fill ${COUNTDOWN}s linear both` }"
              />
            </svg>
            <span class="absolute inset-0 grid place-items-center text-primary">
              <IconUi name="rocket" size="size-8" />
            </span>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-lg font-semibold text-foreground">Going live</h2>
            <p class="text-sm leading-relaxed text-secondary">
              Your changes are about to publish. Clicked by mistake? You can still cancel.
            </p>
          </div>
          <ButtonUi variant="outline" class="min-w-36" @click="cancel">Cancel</ButtonUi>
        </div>

        <!-- ── Publishing ── -->
        <div v-else-if="phase === 'publishing'" key="publishing" class="flex flex-col items-center gap-6">
          <span class="size-16 animate-spin rounded-full border-4 border-secondary/20 border-t-primary" />
          <div class="space-y-1.5">
            <h2 class="text-lg font-semibold text-foreground">Publishing…</h2>
            <p class="text-sm leading-relaxed text-secondary">Building and deploying your live site.</p>
          </div>
        </div>

        <!-- ── Success ── -->
        <div v-else-if="phase === 'success'" key="success" class="flex flex-col items-center gap-6">
          <div class="relative size-20">
            <span class="absolute inset-0 rounded-full bg-green-fg/20 animate-celebrate" />
            <span class="absolute inset-0 grid place-items-center rounded-full bg-green-bg text-green-fg animate-pop-in">
              <IconUi name="check" size="size-9" />
            </span>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-xl font-semibold text-foreground">You’re live!</h2>
            <p class="text-sm leading-relaxed text-secondary">Your changes are now published for everyone to see.</p>
          </div>
          <div class="flex w-full flex-col items-center gap-2">
            <ButtonUi variant="solid" icon="external-link" class="min-w-48" @click="viewLive">
              View live site
            </ButtonUi>
            <ButtonUi variant="ghost" size="sm" @click="open = false">Done</ButtonUi>
          </div>
        </div>

        <!-- ── Error ── -->
        <div v-else key="error" class="flex flex-col items-center gap-6">
          <span class="grid size-20 place-items-center rounded-full bg-red-bg text-red-fg animate-pop-in">
            <IconUi name="alert" size="size-9" />
          </span>
          <div class="space-y-1.5">
            <h2 class="text-lg font-semibold text-foreground">Publishing failed</h2>
            <p class="text-sm leading-relaxed text-secondary">{{ errorMessage }}</p>
          </div>
          <div class="flex w-full flex-col items-center gap-2">
            <ButtonUi variant="solid" class="min-w-36" @click="runPublish">Try again</ButtonUi>
            <ButtonUi variant="ghost" size="sm" @click="open = false">Close</ButtonUi>
          </div>
        </div>
      </Transition>
    </div>
  </ModalUi>
</template>
