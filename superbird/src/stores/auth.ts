import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginService, logout as logoutService, getSession } from '@/lib/auth'
import type { User } from '@/types/setup'

// Authenticated session state. Hydrates from any existing session on creation.
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(getSession())
  const authenticating = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)

  async function login(email: string, password: string) {
    authenticating.value = true
    error.value = null
    try {
      currentUser.value = await loginService(email, password)
      return currentUser.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign in failed.'
      throw e
    } finally {
      authenticating.value = false
    }
  }

  function logout() {
    logoutService()
    currentUser.value = null
  }

  // Re-read the session (e.g. after setup established one).
  function refresh() {
    currentUser.value = getSession()
  }

  return { currentUser, authenticating, error, isAuthenticated, login, logout, refresh }
})
