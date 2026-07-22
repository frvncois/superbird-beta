<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { fontSetStack } from '@/lib/fonts'
import { DEFAULT_FONTS } from '@/data/defaultFonts'
import IconUi from '@/components/ui/IconUi.vue'

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
  DEFAULT_FONTS.map((b) => ({ value: b.value, label: b.name, preview: b.value })),
)

const allOpts = computed(() => [...variableOpts.value, ...setOpts.value, ...defaultOpts.value])
const selectedLabel = computed(() => {
  const match = allOpts.value.find((o) => o.value === props.modelValue)
  if (match) return match.label
  return props.modelValue || ''
})

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
        open ? 'border-foreground/40 outline-secondary/10' : 'border-foreground/15 hover:border-foreground/25 cursor-pointer',
      ]"
      @click="open = !open"
    >
      <span :class="['min-w-0 flex-1 truncate text-left', selectedLabel ? 'text-foreground' : 'text-foreground/40']">
        {{ selectedLabel || 'inherit' }}
      </span>
      <IconUi name="chevron-down" size="size-3" :class="['shrink-0 text-secondary transition-transform duration-200', open && 'rotate-180']" />
    </button>

    <div v-if="open" class="fixed inset-0 z-40" @mousedown="open = false" />

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
    >
      <div v-if="open" class="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 origin-top overflow-y-auto rounded-xl border bg-background p-1 shadow-lg">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground/60 hover:bg-secondary/10 transition-colors duration-100"
          @mousedown.prevent="select('')"
        >
          Inherit
        </button>

        <template v-if="variableOpts.length">
          <div class="px-2.5 pb-0.5 pt-2 text-[9px] font-mono uppercase tracking-wider text-secondary/50">Variables</div>
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
          <div class="px-2.5 pb-0.5 pt-2 text-[9px] font-mono uppercase tracking-wider text-secondary/50">Your fonts</div>
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

        <div class="px-2.5 pb-0.5 pt-2 text-[9px] font-mono uppercase tracking-wider text-secondary/50">Default</div>
        <button
          v-for="o in defaultOpts"
          :key="o.value"
          type="button"
          :class="['flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-100', o.value === modelValue ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/10']"
          :style="{ fontFamily: o.preview }"
          @mousedown.prevent="select(o.value)"
        >
          <span class="min-w-0 flex-1 truncate">{{ o.label }}</span>
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
    </Transition>
  </div>
</template>
