<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssistantStore } from '@/stores/assistant'
import IconUi from '@/components/ui/IconUi.vue'

const assistant = useAssistantStore()
const router = useRouter()

const draft = ref('')
const scrollEl = ref<HTMLElement | null>(null)

onMounted(() => assistant.loadConfig())

function submit() {
  const text = draft.value
  draft.value = ''
  assistant.send(text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function goSettings() {
  assistant.close()
  router.push({ path: '/settings', query: { tab: 'integration' } })
}

// Keep the transcript pinned to the newest message.
watch(
  () => assistant.items.length,
  async () => {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  },
)
</script>

<template>
  <div class="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
    <!-- Chat panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 scale-[0.98]"
    >
      <div
        v-if="assistant.isOpen"
        class="flex h-[560px] max-h-[calc(100vh-7rem)] w-[400px] max-w-[calc(100vw-2.5rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
      >
        <!-- Header -->
        <div class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <IconUi name="sparkles" size="size-4" class="text-primary" />
          <span class="flex-1 text-sm font-medium text-foreground">Assistant</span>
          <button
            v-if="assistant.items.length"
            class="rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-secondary cursor-pointer hover:bg-secondary/10"
            @click="assistant.reset()"
          >
            New
          </button>
          <button class="rounded-md p-1 text-secondary cursor-pointer hover:bg-secondary/10" @click="assistant.close()">
            <IconUi name="close" size="size-4" />
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <!-- Not configured -->
          <div v-if="!assistant.configured" class="rounded-xl border border-dashed p-4 text-center">
            <IconUi name="sparkles" size="size-6" class="mx-auto text-primary" />
            <p class="mt-2 text-sm font-medium text-foreground">Connect an AI provider</p>
            <p class="mt-1 text-xs text-secondary">Add your Anthropic or OpenAI key to start building with the assistant.</p>
            <button class="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white cursor-pointer hover:opacity-90" @click="goSettings">
              Open Integration settings
            </button>
          </div>

          <!-- Empty state -->
          <div v-else-if="!assistant.items.length" class="pt-6 text-center">
            <IconUi name="sparkles" size="size-6" class="mx-auto text-primary/70" />
            <p class="mt-2 text-sm text-foreground">Describe what to build</p>
            <p class="mt-1 text-xs text-secondary">“Build a landing page for a coffee shop” · “Add a dark-mode toggle” · “Translate the homepage to French”</p>
          </div>

          <!-- Transcript -->
          <template v-for="item in assistant.items" :key="item.id">
            <div v-if="item.kind === 'user'" class="flex justify-end">
              <div class="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-white whitespace-pre-wrap">{{ item.text }}</div>
            </div>

            <div v-else-if="item.kind === 'assistant'" class="max-w-[92%] text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {{ item.text }}
            </div>

            <div v-else-if="item.kind === 'tool'" class="flex items-center gap-2 text-xs text-secondary">
              <IconUi
                :name="item.status === 'error' ? 'close' : item.status === 'done' ? 'check' : 'sparkles'"
                size="size-3"
                :class="[
                  'shrink-0',
                  item.status === 'error' ? 'text-red-fg' : item.status === 'done' ? 'text-green-fg' : 'text-primary animate-pulse',
                ]"
              />
              <span :class="item.status === 'running' ? 'text-foreground' : ''">{{ item.summary }}</span>
            </div>

            <div v-else-if="item.kind === 'error'" class="rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ item.text }}</div>
          </template>
        </div>

        <!-- Composer -->
        <div class="shrink-0 border-t p-3">
          <div class="flex items-end gap-2 rounded-xl border bg-input px-3 py-2 focus-within:border-foreground/40">
            <textarea
              v-model="draft"
              rows="1"
              :disabled="assistant.sending"
              placeholder="Ask the assistant to build or edit…"
              class="max-h-28 min-h-5 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none disabled:opacity-50"
              @keydown="onKeydown"
            />
            <button
              class="shrink-0 rounded-lg bg-primary p-1.5 text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40"
              :disabled="assistant.sending || !draft.trim()"
              @click="submit"
            >
              <IconUi :name="assistant.sending ? 'sparkles' : 'chevron-right'" size="size-4" :class="assistant.sending && 'animate-pulse'" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Floating button -->
    <button
      class="flex h-11 items-center gap-2 rounded-full border bg-background pl-3.5 pr-4 shadow-lg cursor-pointer transition-all duration-150 hover:shadow-xl"
      :class="assistant.isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      @click="assistant.open()"
    >
      <IconUi name="sparkles" size="size-4" class="text-primary" />
      <span class="text-sm font-medium text-foreground">Assistant</span>
    </button>
  </div>
</template>
