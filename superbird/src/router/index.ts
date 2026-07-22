import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import EditorView from '@/views/EditorView.vue'
import SettingsView from '@/views/SettingsView.vue'
import SetupView from '@/views/SetupView.vue'
import LoginView from '@/views/LoginView.vue'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: SetupView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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

// Access gate:
//  - not installed → /setup (only)
//  - installed but signed out → /login (only)
//  - installed + signed in → app (/setup and /login bounce home)
router.beforeEach((to) => {
  const setup = useSetupStore()
  const auth = useAuthStore()

  if (!setup.isInstalled) {
    return to.name === 'setup' ? true : { name: 'setup' }
  }
  // Installed:
  if (to.name === 'setup') {
    return { name: auth.isAuthenticated ? 'dashboard' : 'login' }
  }
  if (!auth.isAuthenticated) {
    return to.name === 'login' ? true : { name: 'login' }
  }
  if (to.name === 'login') {
    return { name: 'dashboard' }
  }
  return true
})

export default router
