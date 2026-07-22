import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { install as installService } from '@/lib/installer'
import type { Project, SetupPayload } from '@shared/types'

// Install state. `project` is the source of truth for "is the app provisioned".
// Hydrated on boot from the API (see main.ts); the session lives in the auth store.
export const useSetupStore = defineStore('setup', () => {
  const project = ref<Project | null>(null)
  const publishedAt = ref<string | null>(null)
  const installing = ref(false)
  const error = ref<string | null>(null)

  const isInstalled = computed(() => project.value !== null)
  const isPublished = computed(() => publishedAt.value !== null)

  function hydrate(p: Project | null, published: string | null = null) {
    project.value = p
    publishedAt.value = published
  }

  function markPublished(at: string) {
    publishedAt.value = at
  }

  async function install(payload: SetupPayload) {
    installing.value = true
    error.value = null
    try {
      const result = await installService(payload)
      project.value = result.project
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Setup failed. Please try again.'
      throw e
    } finally {
      installing.value = false
    }
  }

  return { project, publishedAt, installing, error, isInstalled, isPublished, hydrate, markPublished, install }
})
