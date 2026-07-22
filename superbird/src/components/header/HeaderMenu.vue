<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvas'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  mode: 'dashboard' | 'editor' | 'settings'
}>()

const store = useCanvasStore()
const media = useMediaStore()
const auth = useAuthStore()
const router = useRouter()

const isOpen = ref(false)

function close() {
  isOpen.value = false
}
function goDashboard() {
  router.push('/')
  close()
}
function openSettings() {
  router.push('/settings')
  close()
}
function openEditor(editorMode: 'design' | 'content') {
  store.setEditorMode(editorMode)
  router.push('/editor')
  close()
}
function openMediaLibrary() {
  media.openLibrary()
  close()
}
async function logout() {
  await auth.logout()
  close()
  router.push('/login')
}

// The trigger shows which app section you're in (not the site page). In the
// editor it mirrors the active mode — exactly matching its menu button.
const triggerLabel = computed(() => {
  if (props.mode === 'dashboard') return 'Dashboard'
  if (props.mode === 'settings') return 'Settings'
  return store.editorMode === 'content' ? 'Edit content' : 'Edit design'
})
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      class="flex h-7 w-48 items-center justify-between gap-1.5 rounded-lg border px-3 text-xs cursor-pointer transition-colors duration-150 hover:bg-secondary/10"
      @click="isOpen = !isOpen"
    >
      <span class="truncate font-medium">{{ triggerLabel }}</span>
      <IconUi name="chevron-down" size="size-3" :class="['shrink-0 text-secondary transition-transform duration-150', isOpen && 'rotate-180']" />
    </button>

    <PopoverUi v-model:open="isOpen" align="left" panel-class="w-56 rounded-2xl p-1.5">
      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="goDashboard"
      >
        <IconUi name="home" size="size-3.5" class="text-secondary" /> Dashboard
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openMediaLibrary"
      >
        <IconUi name="image" size="size-3.5" class="text-secondary" /> Media Library
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openSettings"
      >
        <IconUi name="settings" size="size-3.5" class="text-secondary" /> Settings
      </button>

      <div class="my-1 border-t border-foreground/8" />

      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openEditor('content')"
      >
        <IconUi name="document" size="size-3.5" class="text-secondary" /> Edit content
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openEditor('design')"
      >
        <IconUi name="background" size="size-3.5" class="text-secondary" /> Edit design
      </button>

      <div class="my-1 border-t border-foreground/8" />

      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="logout"
      >
        <IconUi name="logout" size="size-3.5" class="text-secondary" /> Logout
      </button>
    </PopoverUi>
  </div>
</template>
