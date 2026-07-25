<script setup lang="ts">
import { useMcpStore } from '@/stores/mcp'
import IconUi from '@/components/ui/IconUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

// Locks the editor while the MCP assistant is actively editing, so the user
// can't fight its changes. "Take over" pauses the assistant (it's told to stop);
// a small banner then lets the user resume.
const mcp = useMcpStore()
</script>

<template>
  <!-- Blocking lock while the assistant is editing -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mcp.active && !mcp.paused"
      class="fixed inset-0 z-[75] flex items-end justify-center bg-background/40 backdrop-blur-[1px]"
      style="cursor: not-allowed"
      @mousedown.stop.prevent
      @click.stop.prevent
      @contextmenu.stop.prevent
    >
      <div class="mb-16 flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 shadow-2xl" style="cursor: default">
        <span class="relative flex size-8 shrink-0 items-center justify-center">
          <span class="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <IconUi name="sparkles" size="size-4" class="text-primary" />
        </span>
        <div class="min-w-0">
          <div class="text-sm font-medium text-foreground">Assistant is editing…</div>
          <div class="truncate text-xs text-secondary">{{ mcp.lastAction || 'Working' }} · {{ mcp.actionCount }} actions</div>
        </div>
        <ButtonUi variant="outline" size="sm" class="ml-2 shrink-0" @click="mcp.pause()">
          Take over
        </ButtonUi>
      </div>
    </div>
  </Transition>

  <!-- Paused: user is in control; the assistant is refused until resumed -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="mcp.paused"
      class="fixed bottom-5 left-1/2 z-[75] flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg"
    >
      <span class="size-2 shrink-0 rounded-full bg-amber-fg" />
      <span class="text-xs text-foreground">You're in control — the assistant is paused.</span>
      <ButtonUi variant="ghost" size="sm" class="shrink-0" @click="mcp.resume()">
        Resume assistant
      </ButtonUi>
    </div>
  </Transition>
</template>
