import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { readInstall, install as installService, clearInstall } from '@/lib/installer'
import { saveCredentials, clearAuth } from '@/lib/auth'
import type { Project, SetupPayload } from '@/types/setup'

// Setup / installation state. `project` is the source of truth for whether the
// app has been provisioned. The authenticated session lives in the auth store.
export const useSetupStore = defineStore('setup', () => {
  const initial = readInstall()
  const project = ref<Project | null>(initial?.project ?? null)
  const installing = ref(false)
  const error = ref<string | null>(null)

  const isInstalled = computed(() => project.value !== null)

  async function install(payload: SetupPayload) {
    installing.value = true
    error.value = null
    try {
      const result = await installService(payload)
      project.value = result.project
      // PROTOTYPE: persist credentials so the admin can sign in afterwards.
      saveCredentials(payload.admin.email, payload.admin.password)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Setup failed. Please try again.'
      throw e
    } finally {
      installing.value = false
    }
  }

  function reset() {
    clearInstall()
    clearAuth()
    project.value = null
  }

  return { project, installing, error, isInstalled, install, reset }
})
