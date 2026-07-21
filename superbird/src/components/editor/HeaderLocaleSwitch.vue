<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalesStore } from '@/stores/locales'
import { DEFAULT_LOCALES } from '@/constants/canvas'
import type { Locale } from '@/types/canvas'

const store = useLocalesStore()
const isOpen = ref(false)
const showAdd = ref(false)

const currentLocale = computed(() =>
  store.locales.find((l) => l.code === store.activeLocale),
)

const availableToAdd = computed(() =>
  DEFAULT_LOCALES.filter((l) => !store.locales.some((el) => el.code === l.code)),
)

function selectLocale(code: string) {
  store.setActiveLocale(code)
  isOpen.value = false
}

function addLocale(locale: Locale) {
  store.addLocale(locale)
  store.setActiveLocale(locale.code)
  showAdd.value = false
  isOpen.value = false
}

function removeLocale(code: string) {
  store.removeLocale(code)
}

function close() {
  isOpen.value = false
  showAdd.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      class="flex items-center gap-1 rounded-xl px-2 h-7 text-xs cursor-pointer transition-colors duration-150 hover:bg-secondary/10"
      @click="isOpen = !isOpen"
    >
      <svg class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.171 4.146l1.947 4.948-1.637.002C6.565 9.098 5.78 9.534 5.25 10.19a5.62 5.62 0 0 0-.865 1.777l-.004.015a.75.75 0 0 1-1.441-.422l.004-.014a7.12 7.12 0 0 1 1.096-2.256 5.347 5.347 0 0 1 1.41-1.32L3.1 3.18a.75.75 0 0 1 1.399-.54l1.336 3.398 1.336-3.398a.75.75 0 0 1 1.399.006ZM11.15 7.75a.75.75 0 0 1 .69.459l3.675 8.75a.75.75 0 1 1-1.384.58l-.875-2.083h-4.312l-.875 2.084a.75.75 0 0 1-1.384-.581l3.675-8.75a.75.75 0 0 1 .79-.459Zm-1.595 6.206h3.19L11.5 10.263l-1.945 3.693Z" clip-rule="evenodd" />
      </svg>
      <span class="font-mono text-[10px] font-medium">{{ currentLocale?.flag }}</span>
    </button>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="close" />

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="isOpen" class="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border bg-background p-1.5 shadow-lg">
        <!-- Active locales -->
        <div class="space-y-0.5">
          <button
            v-for="locale in store.locales"
            :key="locale.code"
            :class="[
              'flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100',
              locale.code === store.activeLocale
                ? 'bg-primary/10 text-foreground font-medium'
                : 'text-foreground hover:bg-secondary/10',
            ]"
            @click="selectLocale(locale.code)"
          >
            <span class="w-6 text-[10px] font-mono font-semibold text-secondary">{{ locale.flag }}</span>
            <span class="flex-1 text-left">{{ locale.label }}</span>
            <span v-if="locale.code === store.defaultLocale" class="text-[9px] text-secondary/50 font-mono">default</span>
            <button
              v-else
              class="flex size-4 items-center justify-center rounded text-secondary/30 cursor-pointer hover:text-red-fg transition-colors duration-100"
              @click.stop="removeLocale(locale.code)"
            >
              <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </button>
        </div>

        <div class="my-1.5 border-t border-foreground/8" />

        <!-- Add language -->
        <template v-if="showAdd">
          <div class="max-h-48 overflow-y-auto space-y-0.5">
            <button
              v-for="locale in availableToAdd"
              :key="locale.code"
              class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @click="addLocale(locale)"
            >
              <span class="w-6 text-[10px] font-mono font-semibold text-secondary">{{ locale.flag }}</span>
              <span>{{ locale.label }}</span>
            </button>
          </div>
          <button
            class="mt-1 w-full rounded-xl px-3 py-1.5 text-[10px] text-secondary text-center cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            @click="showAdd = false"
          >
            Cancel
          </button>
        </template>
        <button
          v-else
          class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
          @click="showAdd = true"
        >
          <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add language
        </button>
      </div>
    </Transition>
  </div>
</template>
