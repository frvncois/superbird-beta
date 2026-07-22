import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Locale } from '@/types/canvas'

export const useLocalesStore = defineStore('locales', () => {
  const locales = ref<Locale[]>([
    { code: 'en', label: 'English', flag: 'EN' },
  ])
  const activeLocale = ref('en')
  const defaultLocale = ref('en')

  const isDefaultLocale = computed(() => activeLocale.value === defaultLocale.value)

  // Replace locale config from a loaded project document.
  function hydrate(loaded: { locales: Locale[]; activeLocale: string; defaultLocale: string }) {
    locales.value = loaded.locales
    activeLocale.value = loaded.activeLocale
    defaultLocale.value = loaded.defaultLocale
  }

  function addLocale(locale: Locale) {
    if (locales.value.some((l) => l.code === locale.code)) return
    locales.value.push(locale)
  }

  function removeLocale(code: string) {
    if (code === defaultLocale.value) return
    locales.value = locales.value.filter((l) => l.code !== code)
    if (activeLocale.value === code) {
      activeLocale.value = defaultLocale.value
    }
  }

  function setActiveLocale(code: string) {
    activeLocale.value = code
  }

  return {
    locales,
    activeLocale,
    defaultLocale,
    isDefaultLocale,
    hydrate,
    addLocale,
    removeLocale,
    setActiveLocale,
  }
})
