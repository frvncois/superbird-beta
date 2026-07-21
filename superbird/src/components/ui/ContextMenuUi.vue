<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { isSeparator, type ContextMenuItem } from '@/types/actions'

const props = defineProps<{
  items: ContextMenuItem[]
  x: number
  y: number
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

onMounted(async () => {
  await nextTick()
  if (!menuRef.value) return

  const rect = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (props.x + rect.width > vw - 8) {
    adjustedX.value = props.x - rect.width
  }
  if (props.y + rect.height > vh - 8) {
    adjustedY.value = Math.max(8, props.y - rect.height)
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

function handleAction(item: ContextMenuItem) {
  if (isSeparator(item)) return
  if (item.disabled) return
  item.handler()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[9998]" @click="emit('close')" @contextmenu.prevent="emit('close')" />

    <!-- Menu -->
    <div
      ref="menuRef"
      class="fixed z-[9999] min-w-44 rounded-xl border bg-background p-1 shadow-lg animate-fade-in"
      :style="{ left: `${adjustedX}px`, top: `${adjustedY}px` }"
    >
      <template v-for="(item, i) in items" :key="i">
        <!-- Separator -->
        <div v-if="isSeparator(item)" class="my-1 border-t border-foreground/8" />

        <!-- Action -->
        <button
          v-else
          :disabled="item.disabled"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-75 cursor-pointer',
            item.disabled
              ? 'text-secondary/40 cursor-default'
              : item.danger
                ? 'text-red-fg hover:bg-red-bg'
                : 'text-foreground hover:bg-secondary/10',
          ]"
          @click="handleAction(item)"
        >
          <!-- Icon -->
          <span class="flex size-4 shrink-0 items-center justify-center">
            <!-- Rename -->
            <svg v-if="item.icon === 'rename'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
            </svg>
            <!-- Duplicate -->
            <svg v-else-if="item.icon === 'duplicate'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
              <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
            </svg>
            <!-- Copy -->
            <svg v-else-if="item.icon === 'copy'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15.988 3.012A2.25 2.25 0 0 0 13.75 1h-3.5a2.25 2.25 0 0 0-2.238 2.012 3.25 3.25 0 0 0-3.012 3.238v7.5a3.25 3.25 0 0 0 3.25 3.25h7.5a3.25 3.25 0 0 0 3.25-3.25v-7.5a3.25 3.25 0 0 0-3.012-3.238ZM13.75 2.5a.75.75 0 0 1 .75.75v.25h-5.5A1.75 1.75 0 0 0 7.25 5.25v7h-.25a1.75 1.75 0 0 1-1.75-1.75v-4.25A1.75 1.75 0 0 1 7 4.5h6.75Z" />
            </svg>
            <!-- Paste -->
            <svg v-else-if="item.icon === 'paste'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M13.887 3.182c.396.037.79.08 1.183.128C16.194 3.45 17 4.414 17 5.517V16.75A2.25 2.25 0 0 1 14.75 19h-9.5A2.25 2.25 0 0 1 3 16.75V5.517c0-1.103.806-2.068 1.93-2.207.393-.048.787-.09 1.183-.128A3.256 3.256 0 0 1 9 1h2c1.373 0 2.531.848 2.887 2.182ZM7.5 4A1.75 1.75 0 0 1 9 2.5h2A1.75 1.75 0 0 1 12.5 4v.5h-5V4Z" clip-rule="evenodd" />
            </svg>
            <!-- Wrap -->
            <svg v-else-if="item.icon === 'wrap'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13ZM3.5 3.5h13v13h-13v-13Z" clip-rule="evenodd" />
            </svg>
            <!-- Unwrap -->
            <svg v-else-if="item.icon === 'unwrap'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
            <!-- Move up -->
            <svg v-else-if="item.icon === 'move-up'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
            </svg>
            <!-- Move down -->
            <svg v-else-if="item.icon === 'move-down'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" />
            </svg>
            <!-- Classes -->
            <svg v-else-if="item.icon === 'classes'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.879a2.5 2.5 0 0 0 .732 1.767l7.5 7.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-7.5-7.5A2.5 2.5 0 0 0 7.378 2H4.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
            </svg>
            <!-- Delete -->
            <svg v-else-if="item.icon === 'delete'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
            </svg>
            <!-- Add -->
            <svg v-else-if="item.icon === 'add'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <!-- Select parent -->
            <svg v-else-if="item.icon === 'select-parent'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
            </svg>
            <!-- Component -->
            <svg v-else-if="item.icon === 'component'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
            </svg>
            <!-- Expand/Collapse -->
            <svg v-else-if="item.icon === 'expand' || item.icon === 'collapse'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>
          </span>

          <!-- Label -->
          <span class="flex-1 text-left">{{ item.label }}</span>

          <!-- Shortcut -->
          <span v-if="item.shortcut" class="text-[10px] text-secondary/50 font-mono">{{ item.shortcut }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-fade-in {
  animation: ctx-fade-in 0.1s ease-out;
}

@keyframes ctx-fade-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
