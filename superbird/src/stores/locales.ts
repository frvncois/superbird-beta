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
    addLocale,
    removeLocale,
    setActiveLocale,
  }
})
