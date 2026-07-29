<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { isSeparator, type ContextMenuItem } from '@/types/contextMenu'
import IconUi from '@/components/ui/IconUi.vue'

const ICON_ALIASES: Record<string, string> = {
  expand: 'chevron-down',
  collapse: 'chevron-down',
}

function resolveIcon(icon: string): string {
  return ICON_ALIASES[icon] ?? icon
}

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
    <div class="fixed inset-0 z-[9998]" @click="emit('close')" @contextmenu.prevent="emit('close')" />

    <div
      ref="menuRef"
      class="fixed z-[9999] min-w-44 rounded-xl border bg-background p-1 shadow-lg animate-modal-in origin-top-left"
      :style="{ left: `${adjustedX}px`, top: `${adjustedY}px` }"
    >
      <template v-for="(item, i) in items" :key="i">
        <div v-if="isSeparator(item)" class="my-1 border-t border-foreground/8" />

        <button
          v-else
          type="button"
          :disabled="item.disabled"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
            item.disabled
              ? 'text-secondary/40 cursor-default'
              : item.danger
                ? 'text-red-fg hover:bg-red-bg cursor-pointer'
                : 'text-foreground hover:bg-secondary/10 cursor-pointer',
          ]"
          @click="handleAction(item)"
        >
          <span class="flex size-4 shrink-0 items-center justify-center">
            <IconUi v-if="item.icon" :name="resolveIcon(item.icon)" size="size-3.5" />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.shortcut" class="text-[10px] text-secondary/50 font-mono">{{ item.shortcut }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>
