<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { fontSetStack } from '@/lib/fonts'
import { DEFAULT_FONTS } from '@/data/defaultFonts'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import PopoverUi from '@/components/ui/PopoverUi.vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const store = useGlobalStylesStore()
const router = useRouter()
const open = ref(false)

interface Opt {
  value: string
  label: string
  // Font stack used to preview the option in its own typeface.
  preview: string
  // Sans / Serif / Mono badge (default fonts only).
  category?: string
}

const variableOpts = computed<Opt[]>(() =>
  Object.entries(store.globalStyles.fonts).map(([name, stack]) => ({
    value: `var(--global-font-${name})`,
    label: name,
    preview: stack,
  })),
)
const setOpts = computed<Opt[]>(() =>
  (store.globalStyles.fontSet ?? []).map((f) => {
    const stack = fontSetStack(f)
    return { value: stack, label: f.name, preview: stack }
  }),
)
const defaultOpts = computed<Opt[]>(() =>
  DEFAULT_FONTS.map((b) => ({ value: b.value, label: b.name, preview: b.value, category: b.category })),
)

const allOpts = computed(() => [...variableOpts.value, ...setOpts.value, ...defaultOpts.value])
const selected = computed(() => allOpts.value.find((o) => o.value === props.modelValue))
const selectedLabel = computed(() => selected.value?.label ?? props.modelValue ?? '')

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function manage() {
  open.value = false
  router.push({ path: '/settings', query: { tab: 'typography' } })
}
</script>

<template>
  <div class="relative w-full min-w-0">
    <button
      type="button"
      :class="[
        'flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg bg-input border px-2.5 text-xs outline-3 outline-transparent transition-colors duration-150',
        open ? 'border-input-border-focus outline-secondary/10' : 'border-input-border hover:border-input-border-focus cursor-pointer',
      ]"
      @click="open = !open"
    >
      <span :class="['min-w-0 flex-1 truncate text-left', selectedLabel ? 'text-foreground' : 'text-foreground/40']">
        {{ selectedLabel || 'inherit' }}
      </span>
      <BadgeUi v-if="selected?.category" variant="neutral" size="xs" mono class="shrink-0">{{ selected.category }}</BadgeUi>
      <IconUi name="chevron-down" size="size-3" :class="['shrink-0 text-secondary transition-transform duration-200', open && 'rotate-180']" />
    </button>

    <PopoverUi v-model:open="open" align="full" transition="scale" panel-class="">
      <div class="max-h-72 overflow-y-auto p-1">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground/60 hover:bg-secondary/10 transition-colors duration-100"
          @mousedown.prevent="select('')"
        >
          Inherit
        </button>

        <template v-if="variableOpts.length">
          <LabelUi size="xs" class="block px-2.5 pb-0.5 pt-2">Variables</LabelUi>
          <button
            v-for="o in variableOpts"
            :key="o.value"
            type="button"
            :class="['flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100', o.value === modelValue ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10']"
            @mousedown.prevent="select(o.value)"
          >
            <span class="min-w-0 flex-1 truncate font-mono">{{ o.label }}</span>
            <IconUi v-if="o.value === modelValue" name="check" size="size-3" class="shrink-0" />
          </button>
        </template>

        <template v-if="setOpts.length">
          <LabelUi size="xs" class="block px-2.5 pb-0.5 pt-2">Your fonts</LabelUi>
          <button
            v-for="o in setOpts"
            :key="o.value"
            type="button"
            :class="['flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-100', o.value === modelValue ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10']"
            :style="{ fontFamily: o.preview }"
            @mousedown.prevent="select(o.value)"
          >
            <span class="min-w-0 flex-1 truncate">{{ o.label }}</span>
            <IconUi v-if="o.value === modelValue" name="check" size="size-3" class="shrink-0" />
          </button>
        </template>

        <LabelUi size="xs" class="block px-2.5 pb-0.5 pt-2">Default</LabelUi>
        <button
          v-for="o in defaultOpts"
          :key="o.value"
          type="button"
          :class="['flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-100', o.value === modelValue ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10']"
          :style="{ fontFamily: o.preview }"
          @mousedown.prevent="select(o.value)"
        >
          <span class="min-w-0 flex-1 truncate">{{ o.label }}</span>
          <BadgeUi v-if="o.category" variant="neutral" size="xs" mono class="shrink-0">{{ o.category }}</BadgeUi>
          <IconUi v-if="o.value === modelValue" name="check" size="size-3" class="shrink-0" />
        </button>

        <div class="mt-1 border-t border-foreground/8 pt-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-primary hover:bg-primary/10 transition-colors duration-100"
            @mousedown.prevent="manage"
          >
            <IconUi name="settings" size="size-3" class="shrink-0" />
            Manage font family
          </button>
        </div>
      </div>
    </PopoverUi>
  </div>
</template>
