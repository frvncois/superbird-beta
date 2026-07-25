import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createDefaultSiteSettings } from '@/lib/siteDefaults'
import { generateRedirectId } from '@/lib/ids'
import type { FormConfig, SiteSettings } from '@/types/canvas'

// A form's config the first time it's touched — save to DB on by default.
function defaultFormConfig(): FormConfig {
  return { saveToDb: true }
}

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const siteSettings = ref<SiteSettings>(createDefaultSiteSettings())

  // Replace site settings from a loaded project document. Merge defaults at the
  // top level so docs saved before a section existed still get it.
  function hydrate(loaded: SiteSettings) {
    siteSettings.value = { ...createDefaultSiteSettings(), ...loaded }
  }

  function updateImageCompression(updates: Partial<SiteSettings['imageCompression']>) {
    Object.assign(siteSettings.value.imageCompression, updates)
  }

  function updateSiteIdentity(updates: Partial<SiteSettings['identity']>) {
    Object.assign(siteSettings.value.identity, updates)
  }

  function updateDeployment(updates: Partial<SiteSettings['deployment']>) {
    Object.assign(siteSettings.value.deployment, updates)
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

  function updateFormConfig(formId: string, updates: Partial<FormConfig>) {
    const existing = siteSettings.value.forms[formId] ?? defaultFormConfig()
    siteSettings.value.forms[formId] = { ...existing, ...updates }
  }

  return {
    siteSettings,
    hydrate,
    updateImageCompression,
    updateSiteIdentity,
    updateDeployment,
    updateSeo,
    updateCustomCode,
    addRedirect,
    removeRedirect,
    updateFormConfig,
  }
})
