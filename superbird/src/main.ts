import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { fetchSessionState } from '@/lib/api'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'
import { useCommentsStore } from '@/stores/comments'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useToast } from '@/composables/useToast'
import { initAutoHideScrollbars } from '@/lib/autoHideScrollbars'

import './assets/main.css'

// Show scrollbars only while an area is being scrolled (see main.css).
initAutoHideScrollbars()

const app = createApp(App)
app.use(createPinia())

// Load install + session state from the API before routing, so navigation
// guards see the real state on first paint. If already signed in, also load
// the project. If the API is unreachable the app still mounts (uninstalled/
// signed-out) and surfaces the error at the gate.
try {
  const state = await fetchSessionState()
  useSetupStore().hydrate(state.project, state.publishedAt)
  useAuthStore().hydrate(state.user)
  if (state.user) {
    await useProjectPersistence().load()
    await useMediaStore().load()
    await useCommentsStore().load()
  }
} catch (e) {
  console.error('[superbird] Could not reach the API on startup.', e)
  // Surface it — the queued toast renders as soon as ToastHost mounts below.
  useToast().error('Couldn’t reach the server. Some features may not work.', {
    duration: 0,
    action: { label: 'Reload', handler: () => location.reload() },
  })
}

app.use(router)
app.mount('#app')
