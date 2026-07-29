<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvas'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import { useSetupStore } from '@/stores/setup'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import DropdownUi, { type DropdownItem } from '@/components/ui/DropdownUi.vue'
import HeaderContextBar from './HeaderContextBar.vue'
import HeaderSnapshotsButton from './HeaderSnapshotsButton.vue'
import PublishDialog from './PublishDialog.vue'

const router = useRouter()
const canvasStore = useCanvasStore()
const media = useMediaStore()
const auth = useAuthStore()
const setup = useSetupStore()
const route = useRoute()
const { saveState } = useProjectPersistence()

// Autosave is the save, so the badge is purely draft-vs-live; 'Saving…' is the
// brief in-flight transient during each autosave write.
const siteStatus = computed<{ variant: 'success' | 'info' | 'neutral'; label: string; pulse?: boolean }>(() => {
  if (saveState.value === 'saving') return { variant: 'neutral', label: 'Saving…', pulse: true }
  if (!setup.isPublished) return { variant: 'neutral', label: 'Draft' }
  if (setup.hasUnpublishedChanges) return { variant: 'info', label: 'Saved' }
  return { variant: 'success', label: 'Live' }
})

const menuOpen = ref(false)
const ROUTE_INFO = {
  dashboard: { label: 'Dashboard', icon: 'home' },
  editor: { label: 'Editor', icon: 'layout' },
  settings: { label: 'Settings', icon: 'settings' },
} as const
type Mode = keyof typeof ROUTE_INFO
const mode = computed<Mode>(() => (String(route.name ?? '') as Mode) in ROUTE_INFO ? (route.name as Mode) : 'dashboard')
const routeInfo = computed(() => ROUTE_INFO[mode.value])
function goDashboard() {
  router.push('/')
}
function openSettings() {
  router.push('/settings')
}
function openMediaLibrary() {
  media.openLibrary()
}
async function logout() {
  await auth.logout()
  router.push('/login')
}

function openEditor() {
  canvasStore.setEditorMode(auth.canDesign ? 'design' : 'content')
  router.push('/editor')
}

const menuItems = computed<DropdownItem[]>(() => [
  { label: 'Dashboard', icon: 'home', handler: goDashboard },
  { label: 'Media Library', icon: 'image', handler: openMediaLibrary },
  { label: 'Settings', icon: 'settings', handler: openSettings },
  { label: 'Open Editor', icon: 'layout', handler: openEditor },
  { separator: true },
  { label: 'Logout', icon: 'logout', handler: logout },
])

// The whole publish flow (5s cancellable countdown → publish → view live) lives
// in PublishDialog; this just opens it.
const publishOpen = ref(false)
</script>

<template>
  <header class="relative z-40 grid h-[var(--header-height)] shrink-0 grid-cols-[var(--sidebar-width)_1fr_var(--sidebar-width)] items-center px-3.5">
    <div class="flex items-center gap-1.5 pr-3.5">
      <DropdownUi v-model:open="menuOpen" class="w-full" :icon="routeInfo.icon" :label="routeInfo.label" :items="menuItems" />
    </div>

    <div class="flex items-center justify-center gap-1.5">
      <HeaderContextBar v-if="mode === 'editor'" />
    </div>

    <div class="flex items-center justify-end gap-2 ml-3.5">
    <template v-if="mode === 'editor'">
      <BadgeUi class="mr-auto" size="xs" :variant="siteStatus.variant" dot :pulse="siteStatus.pulse">
        {{ siteStatus.label }}
      </BadgeUi>

      <HeaderSnapshotsButton />
      <ButtonUi variant="solid" size="sm" icon="rocket" :disabled="publishOpen" @click="publishOpen = true">
        Publish
      </ButtonUi>
    </template>

    <template v-else-if="mode === 'settings'">
      <ButtonUi variant="outline" size="sm" @click="router.back()">Done</ButtonUi>
    </template>

    <template v-else>
      <BadgeUi :variant="siteStatus.variant" dot :pulse="siteStatus.pulse">
        {{ siteStatus.label }}
      </BadgeUi>
      <ButtonUi variant="solid" size="sm" @click="openEditor">Open Editor</ButtonUi>
    </template>
    </div>
  </header>

  <PublishDialog v-model:open="publishOpen" />
</template>
