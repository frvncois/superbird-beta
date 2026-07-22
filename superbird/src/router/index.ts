import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import EditorView from '@/views/EditorView.vue'
import SettingsView from '@/views/SettingsView.vue'
import SetupView from '@/views/SetupView.vue'
import { useSetupStore } from '@/stores/setup'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: SetupView,
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

// First-run gate: until the app is installed, every route funnels to /setup;
// once installed, /setup redirects home.
router.beforeEach((to) => {
  const setup = useSetupStore()
  if (!setup.isInstalled && to.name !== 'setup') {
    return { name: 'setup' }
  }
  if (setup.isInstalled && to.name === 'setup') {
    return { name: 'dashboard' }
  }
})

export default router
