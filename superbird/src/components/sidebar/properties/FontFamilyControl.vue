<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { fontSetStack } from '@/lib/fonts'
import { DEFAULT_FONTS } from '@/data/defaultFonts'
import DropdownUi, { type DropdownOption } from '@/components/ui/DropdownUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const model = defineModel<string>({ default: '' })

const store = useGlobalStylesStore()
const router = useRouter()

const options = computed<DropdownOption[]>(() => [
  { value: '', label: 'Inherit' },
  ...Object.entries(store.globalStyles.fonts).map(([name, stack]) => ({
    value: `var(--global-font-${name})`,
    label: name,
    group: 'Variables',
    labelClass: 'font-mono',
    labelStyle: { fontFamily: stack },
  })),
  ...(store.globalStyles.fontSet ?? []).map((f) => {
    const stack = fontSetStack(f)
    return { value: stack, label: f.name, group: 'Your fonts', labelStyle: { fontFamily: stack } }
  }),
  ...DEFAULT_FONTS.map((b) => ({
    value: b.value,
    label: b.name,
    group: 'Default',
    badge: b.category,
    labelStyle: { fontFamily: b.value },
  })),
])

function manage() {
  router.push({ path: '/settings', query: { tab: 'typography' } })
}
</script>

<template>
  <DropdownUi v-model="model" :options="options" placeholder="inherit" class="w-full">
    <template #footer="{ close }">
      <div class="mt-1 border-t border-foreground/8 pt-1">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs text-primary hover:bg-primary/10 transition-colors duration-100"
          @click="close(); manage()"
        >
          <IconUi name="settings" size="size-3" class="shrink-0" />
          Manage font family
        </button>
      </div>
    </template>
  </DropdownUi>
</template>
