import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginService, logout as logoutService } from '@/lib/auth'
import type { User } from '@shared/types'

// Authenticated session state. Hydrated on boot from the API (see main.ts).
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const authenticating = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)

  function hydrate(u: User | null) {
    currentUser.value = u
  }

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

  async function logout() {
    await logoutService()
    currentUser.value = null
  }

  return { currentUser, authenticating, error, isAuthenticated, hydrate, login, logout }
})
