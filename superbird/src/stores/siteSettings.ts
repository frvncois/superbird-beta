import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createDefaultSiteSettings } from '@/lib/siteDefaults'
import { generateRedirectId } from '@/lib/ids'
import type { SiteSettings } from '@/types/canvas'

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const siteSettings = ref<SiteSettings>(createDefaultSiteSettings())

  // Replace site settings from a loaded project document.
  function hydrate(loaded: SiteSettings) {
    siteSettings.value = loaded
  }

  function updateSiteIdentity(updates: Partial<SiteSettings['identity']>) {
    Object.assign(siteSettings.value.identity, updates)
  }

  function updateSeo(updates: Partial<SiteSettings['seo']>) {
    Object.assign(siteSettings.value.seo, updates)
  }

  function updateCustomCode(updates: Partial<SiteSettings['customCode']>) {
    Object.assign(siteSettings.value.customCode, updates)
  }

  function addRedirect(from: string, to: string, type: '301' | '302' = '301') {
    siteSettings.value.redirects.push({ id: generateRedirectId(), from, to, type })
  }

  function removeRedirect(id: string) {
    siteSettings.value.redirects = siteSettings.value.redirects.filter((r) => r.id !== id)
  }

  function updateIntegrations(updates: Partial<SiteSettings['integrations']>) {
    Object.assign(siteSettings.value.integrations, updates)
  }

  function addCustomFont(name: string, url: string) {
    siteSettings.value.integrations.customFonts.push({ name, url })
  }

  function removeCustomFont(index: number) {
    siteSettings.value.integrations.customFonts.splice(index, 1)
  }

  return {
    siteSettings,
    hydrate,
    updateSiteIdentity,
    updateSeo,
    updateCustomCode,
    addRedirect,
    removeRedirect,
    updateIntegrations,
    addCustomFont,
    removeCustomFont,
  }
})
