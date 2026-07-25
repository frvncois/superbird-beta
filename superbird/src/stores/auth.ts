import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  login as loginService,
  logout as logoutService,
  logoutAll as logoutAllService,
  verifyTwoFactor as verifyTwoFactorService,
  setupTwoFactor as setupTwoFactorService,
  enableTwoFactor as enableTwoFactorService,
  disableTwoFactor as disableTwoFactorService,
} from '@/lib/auth'
import type { User, LoginResult, TwoFactorSetup, TwoFactorEnableResult } from '@shared/types'

// Authenticated session state. Hydrated on boot from the API (see main.ts).
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const authenticating = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => currentUser.value !== null)
  // Whether the current user may edit design (vs. content only). Admins can;
  // this is the seam for finer-grained roles as they're added.
  const canDesign = computed(() => currentUser.value?.role === 'admin')

  function hydrate(u: User | null) {
    currentUser.value = u
  }

  // Step 1. Sets the user on direct success; returns the raw result so the view
  // can branch to the 2FA code step when a challenge comes back.
  async function login(email: string, password: string, remember = false): Promise<LoginResult> {
    authenticating.value = true
    error.value = null
    try {
      const result = await loginService(email, password, remember)
      if ('user' in result) currentUser.value = result.user
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign in failed.'
      throw e
    } finally {
      authenticating.value = false
    }
  }

  // Step 2. Complete a 2FA challenge and open the session.
  async function verifyTwoFactor(challenge: string, code: string): Promise<User> {
    authenticating.value = true
    error.value = null
    try {
      currentUser.value = await verifyTwoFactorService(challenge, code)
      return currentUser.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Verification failed.'
      throw e
    } finally {
      authenticating.value = false
    }
  }

  async function logout() {
    await logoutService()
    currentUser.value = null
  }

  async function logoutAll() {
    await logoutAllService()
    currentUser.value = null
  }

  // ── 2FA enrollment (reflects the flag on the current user) ──
  function setupTwoFactor(): Promise<TwoFactorSetup> {
    return setupTwoFactorService()
  }
  async function enableTwoFactor(code: string): Promise<TwoFactorEnableResult> {
    const result = await enableTwoFactorService(code)
    if (currentUser.value) currentUser.value = { ...currentUser.value, twoFactorEnabled: true }
    return result
  }
  async function disableTwoFactor(code: string): Promise<void> {
    await disableTwoFactorService(code)
    if (currentUser.value) currentUser.value = { ...currentUser.value, twoFactorEnabled: false }
  }

  return {
    currentUser,
    authenticating,
    error,
    isAuthenticated,
    canDesign,
    hydrate,
    login,
    verifyTwoFactor,
    logout,
    logoutAll,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
  }
})
