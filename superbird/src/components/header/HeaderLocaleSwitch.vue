<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalesStore } from '@/stores/locales'
import { DEFAULT_LOCALES } from '@/constants/canvas'
import type { Locale } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import TooltipUi from '@/components/ui/TooltipUi.vue'

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
    <TooltipUi content="Translations" placement="bottom" :disabled="isOpen">
      <ButtonUi variant="outline" size="sm" icon="globe" @click="isOpen = !isOpen">
        {{ currentLocale?.flag }}
      </ButtonUi>
    </TooltipUi>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-52 p-1.5 rounded-2xl">
      <div>
        <div class="space-y-0.5">
          <div
            v-for="locale in store.locales"
            :key="locale.code"
            class="flex items-center gap-0.5"
          >
            <ButtonUi
              variant="ghost"
              size="sm"
              align="start"
              class="min-w-0 flex-1"
              :active="locale.code === store.activeLocale"
              @click="selectLocale(locale.code)"
            >
              <span class="w-6 text-[10px] font-mono font-semibold text-secondary">{{ locale.flag }}</span>
              <span class="flex-1 truncate text-left">{{ locale.label }}</span>
              <span v-if="locale.code === store.defaultLocale" class="text-[9px] text-secondary/50 font-mono">default</span>
            </ButtonUi>
            <IconButtonUi
              v-if="locale.code !== store.defaultLocale"
              size="sm"
              variant="danger"
              title="Remove language"
              @click="removeLocale(locale.code)"
            >
              <IconUi name="close" size="size-2.5" />
            </IconButtonUi>
          </div>
        </div>

        <div class="my-1.5 border-t border-foreground/8" />

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

    <ConfirmDialogUi
      :open="!!pendingRemove"
      title="Remove language"
      :description="removeDescription"
      confirm-label="Remove"
      @update:open="pendingRemove = null"
      @confirm="doRemove"
    />
  </div>
</template>
