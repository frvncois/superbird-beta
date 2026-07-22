import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { readInstall, install as installService, clearInstall } from '@/lib/installer'
import type { Project, User, SetupPayload } from '@/types/setup'

// Setup / installation state. `project` is the source of truth for whether the
// app has been provisioned; `currentUser` is the (future) authenticated admin.
export const useSetupStore = defineStore('setup', () => {
  const initial = readInstall()
  const project = ref<Project | null>(initial?.project ?? null)
  const currentUser = ref<User | null>(initial?.user ?? null)
  const installing = ref(false)
  const error = ref<string | null>(null)

  const isInstalled = computed(() => project.value !== null)

  async function install(payload: SetupPayload) {
    installing.value = true
    error.value = null
    try {
      const result = await installService(payload)
      project.value = result.project
      currentUser.value = result.user
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
    project.value = null
    currentUser.value = null
  }

  return { project, currentUser, installing, error, isInstalled, install, reset }
})
