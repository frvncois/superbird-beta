import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { fetchSessionState } from '@/lib/api'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'
import { useProjectPersistence } from '@/composables/useProjectPersistence'

import './assets/main.css'

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
  if (state.user) await useProjectPersistence().load()
} catch (e) {
  console.error('[superbird] Could not reach the API on startup.', e)
}

app.use(router)
app.mount('#app')
