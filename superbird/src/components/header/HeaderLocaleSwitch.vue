<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalesStore } from '@/stores/locales'
import { DEFAULT_LOCALES } from '@/constants/canvas'
import type { Locale } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

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

watch(isOpen, (open) => {
  if (!open) showAdd.value = false
})
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      class="flex items-center gap-1 rounded-lg px-2 h-7 text-xs cursor-pointer transition-colors duration-150 hover:bg-secondary/10"
      @click="isOpen = !isOpen"
    >
      <IconUi name="globe" size="size-3.5" class="text-secondary" />
      <span class="font-mono text-[10px] font-medium">{{ currentLocale?.flag }}</span>
    </button>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-52 p-1.5 rounded-2xl">
      <div>
        <!-- Active locales -->
        <div class="space-y-0.5">
          <button
            v-for="locale in store.locales"
            :key="locale.code"
            :class="[
              'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100',
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
              <IconUi name="close" size="size-2.5" />
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
              class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @click="addLocale(locale)"
            >
              <span class="w-6 text-[10px] font-mono font-semibold text-secondary">{{ locale.flag }}</span>
              <span>{{ locale.label }}</span>
            </button>
          </div>
          <button
            class="mt-1 w-full rounded-lg px-3 py-1.5 text-[10px] text-secondary text-center cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            @click="showAdd = false"
          >
            Cancel
          </button>
        </template>
        <button
          v-else
          class="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
          @click="showAdd = true"
        >
          <IconUi name="plus" size="size-3.5" />
          Add language
        </button>
      </div>
    </PopoverUi>
  </div>
</template>
