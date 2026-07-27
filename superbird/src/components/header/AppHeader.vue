<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvas'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useToast } from '@/composables/useToast'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import DropdownUi, { type DropdownItem } from '@/components/ui/DropdownUi.vue'
import ProcessDialogUi from '@/components/ui/ProcessDialogUi.vue'
import HeaderContextBar from './HeaderContextBar.vue'

const router = useRouter()
const canvasStore = useCanvasStore()
const media = useMediaStore()
const auth = useAuthStore()
const route = useRoute()
const toast = useToast()

// ── App menu ──
const menuOpen = ref(false)
// Trigger + right-side actions follow the current route (names map 1:1 to modes),
// so the header is self-configuring — no `mode` prop to keep in sync.
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

// Open the editor in design mode when the user may design, otherwise content.
function openEditor() {
  canvasStore.setEditorMode(auth.canDesign ? 'design' : 'content')
  router.push('/editor')
}

// App-menu rows (DropdownUi closes itself after a handler runs).
const menuItems = computed<DropdownItem[]>(() => [
  { label: 'Dashboard', icon: 'home', handler: goDashboard },
  { label: 'Media Library', icon: 'image', handler: openMediaLibrary },
  { label: 'Settings', icon: 'settings', handler: openSettings },
  { label: 'Open Editor', icon: 'layout', handler: openEditor },
  { separator: true },
  { label: 'Logout', icon: 'logout', handler: logout },
])

// ── Publish status modal (busy → success/error), driven locally ──
// Save the working draft now (changes also autosave in the background). Publish
// = save + promote the draft to the live site.
const saving = ref(false)
async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await useProjectPersistence().save()
    toast.success('Changes saved')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Couldn’t save. Please try again.')
  } finally {
    saving.value = false
  }
}

const publishing = ref(false)
const pub = reactive({
  open: false,
  title: '',
  message: '',
  phase: 'busy' as 'busy' | 'success' | 'error',
  link: null as string | null,
  confirmLabel: 'Done',
})

async function publish() {
  if (publishing.value) return
  publishing.value = true
  Object.assign(pub, {
    open: true,
    title: 'Publishing site',
    message: 'Saving and building your live site…',
    phase: 'busy',
    link: null,
    confirmLabel: 'Done',
  })
  try {
    await useProjectPersistence().publish()
    Object.assign(pub, {
      phase: 'success',
      title: 'Site published',
      message: 'Your changes are now live.',
      link: `${window.location.origin}/`,
      confirmLabel: 'Done',
    })
  } catch (e) {
    Object.assign(pub, {
      phase: 'error',
      message: e instanceof Error ? e.message : 'Publish failed. Please try again.',
      link: null,
      confirmLabel: 'Close',
    })
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <!-- Self-contained app bar: fixed height, sits above the canvas stacking
       context. Same 3-column grid as EditorLayout (left | canvas | right) so the
       menu / context bar / actions align over the sidebars and canvas. -->
  <header class="relative z-40 grid h-[var(--header-height)] shrink-0 grid-cols-[var(--sidebar-width)_1fr_var(--sidebar-width)] items-center px-3.5">
    <!-- Left: app menu (aligns with the left sidebar) -->
    <div class="flex items-center gap-1.5 pr-3.5">
      <DropdownUi v-model:open="menuOpen" class="w-full" :icon="routeInfo.icon" :label="routeInfo.label" :items="menuItems" />
    </div>

    <!-- Center: context bar over the canvas (editor only) -->
    <div class="flex items-center justify-center gap-1.5">
      <HeaderContextBar v-if="mode === 'editor'" />
    </div>

    <!-- Right: actions (aligns with the right sidebar) -->
    <div class="flex items-center justify-end gap-2">
    <template v-if="mode === 'editor'">
      <ButtonUi variant="outline" size="sm" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save' }}
      </ButtonUi>
      <ButtonUi variant="solid" size="sm" :disabled="publishing" @click="publish">
        {{ publishing ? 'Publishing…' : 'Publish' }}
      </ButtonUi>
    </template>

    <template v-else-if="mode === 'settings'">
      <ButtonUi variant="outline" size="sm" @click="router.back()">Done</ButtonUi>
    </template>

    <template v-else>
      <!-- Dashboard: site status (placeholder — wired to data later) -->
      <span class="flex items-center gap-1.5 rounded-lg bg-secondary/5 px-2.5 py-1 text-[11px] text-secondary">
        <span class="size-1.5 rounded-full bg-green-fg" /> Published
      </span>
      <ButtonUi variant="solid" size="sm" @click="openEditor">Open Editor</ButtonUi>
    </template>
    </div>
  </header>

  <!-- Publish status dialog (busy → success/error) -->
  <ProcessDialogUi
    :open="pub.open"
    :phase="pub.phase"
    :title="pub.title"
    :message="pub.message"
    :confirm-label="pub.confirmLabel"
    @close="pub.open = false"
  >
    <a
      v-if="pub.phase === 'success' && pub.link"
      :href="pub.link"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <IconUi name="external-link" size="size-4" /> {{ pub.link }}
    </a>
  </ProcessDialogUi>
</template>
