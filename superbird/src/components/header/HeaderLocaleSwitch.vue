<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalesStore } from '@/stores/locales'
import { DEFAULT_LOCALES } from '@/constants/canvas'
import type { Locale } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

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

const pendingRemove = ref<string | null>(null)

const removeDescription = computed(() => {
  const code = pendingRemove.value
  if (!code) return ''
  const locale = store.locales.find((l) => l.code === code)
  return `Remove ${locale?.label ?? code}? Translated content for this language will be lost. This can’t be undone.`
})

function removeLocale(code: string) {
  pendingRemove.value = code
}

function doRemove() {
  const code = pendingRemove.value
  if (!code) return
  store.removeLocale(code)
  pendingRemove.value = null
}

watch(isOpen, (open) => {
  if (!open) showAdd.value = false
})
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <ButtonUi variant="outline" size="sm" icon="globe" @click="isOpen = !isOpen">
      <span class="font-mono text-[10px] font-medium">{{ currentLocale?.flag }}</span>
    </ButtonUi>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-52 p-1.5 rounded-2xl">
      <div>
        <!-- Active locales -->
        <div class="space-y-0.5">
          <ButtonUi
            v-for="locale in store.locales"
            :key="locale.code"
            variant="ghost"
            size="sm"
            align="start"
            class="w-full"
            :class="locale.code === store.activeLocale ? 'bg-primary/10 font-medium' : ''"
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
          </ButtonUi>
        </div>

        <div class="my-1.5 border-t border-foreground/8" />

        <!-- Add language -->
        <template v-if="showAdd">
          <div class="max-h-48 overflow-y-auto space-y-0.5">
            <ButtonUi
              v-for="locale in availableToAdd"
              :key="locale.code"
              variant="ghost"
              size="sm"
              align="start"
              class="w-full"
              @click="addLocale(locale)"
            >
              <span class="w-6 text-[10px] font-mono font-semibold text-secondary">{{ locale.flag }}</span>
              <span>{{ locale.label }}</span>
            </ButtonUi>
          </div>
          <ButtonUi
            variant="ghost"
            size="sm"
            class="mt-1 w-full"
            @click="showAdd = false"
          >
            Cancel
          </ButtonUi>
        </template>
        <ButtonUi
          v-else
          variant="ghost"
          size="sm"
          align="start"
          icon="plus"
          class="w-full"
          @click="showAdd = true"
        >
          Add language
        </ButtonUi>
      </div>
    </PopoverUi>

    <ModalUi
      :open="!!pendingRemove"
      variant="dialog"
      danger
      icon="alert"
      title="Remove language"
      :description="removeDescription"
      @update:open="pendingRemove = null"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingRemove = null">Cancel</ButtonUi>
        <ButtonUi variant="danger" @click="doRemove">Remove</ButtonUi>
      </template>
    </ModalUi>
  </div>
</template>
