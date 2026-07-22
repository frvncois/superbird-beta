<script setup lang="ts">
import { ref, computed } from 'vue'
import { STYLE_STATES } from '@/constants/canvas'
import { isTailwindUtility } from '@/lib/tailwindToStyles'
import type { StyleState } from '@/types/canvas'
import IconUi from './IconUi.vue'

const props = withDefaults(
  defineProps<{
    classes: string[]
    activeClass: string | null
    allClassNames: string[]
    recentClasses?: string[]
  }>(),
  { recentClasses: () => [] },
)

const activeState = defineModel<StyleState>('activeState', { default: 'default' })

const emit = defineEmits<{
  add: [name: string]
  remove: [name: string]
  select: [name: string]
}>()

const query = ref('')
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Matches while typing (existing classes not already applied).
const suggestions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.allClassNames.filter((n) => n.toLowerCase().includes(q) && !props.classes.includes(n)).slice(0, 6)
})

const canCreate = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return false
  return !props.allClassNames.some((n) => n.toLowerCase() === q)
})

// A recognized Tailwind utility is "added", not "created" as a custom class.
const isTwUtil = computed(() => isTailwindUtility(query.value.trim()))

// Recently-used classes not already applied (shown when not typing).
const recentSelectable = computed(() =>
  props.recentClasses.filter((n) => !props.classes.includes(n)).slice(0, 8),
)

function addClass(name: string) {
  const n = name.trim()
  if (!n) return
  emit('add', n)
  query.value = ''
  inputRef.value?.focus()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && query.value.trim()) {
    e.preventDefault()
    addClass(query.value)
  }
  if (e.key === 'Backspace' && !query.value && props.classes.length > 0) {
    emit('remove', props.classes[props.classes.length - 1]!)
  }
  if (e.key === 'Escape') {
    query.value = ''
    inputRef.value?.blur()
  }
}

function focusInput() {
  inputRef.value?.focus()
}
function handleBlur() {
  // Delay so dropdown mousedown handlers run first.
  setTimeout(() => {
    isFocused.value = false
  }, 150)
}
function selectState(state: StyleState) {
  activeState.value = state
}
</script>

<template>
  <div class="relative">
    <!-- Chips + input -->
    <div
      :class="[
        'flex flex-wrap items-center gap-1 min-h-8 px-1 py-0.5 rounded-xl border cursor-text transition-colors duration-150',
        isFocused ? 'border-foreground/40 outline-3 outline-secondary/10' : 'border-foreground/15 hover:border-foreground/25',
      ]"
      @click="focusInput"
    >
      <button
        v-for="cls in classes"
        :key="cls"
        :class="[
          'group inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono leading-tight cursor-pointer transition-colors duration-100 shrink-0',
          activeClass === cls ? 'bg-primary/15 text-primary' : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15',
        ]"
        @click.stop="emit('select', cls)"
      >
        {{ cls }}
        <IconUi name="close" size="size-2.5" @click.stop="emit('remove', cls)" />
      </button>

      <input
        ref="inputRef"
        v-model="query"
        placeholder="Add class..."
        class="h-5 min-w-[60px] flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground/30 outline-none"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Dropdown (on focus) -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="isFocused" class="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border bg-background p-1 shadow-lg">
        <!-- Create / suggestions (top) -->
        <template v-if="query.trim()">
          <button
            v-for="s in suggestions"
            :key="s"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            @mousedown.prevent="addClass(s)"
          >
            <span class="font-mono text-[10px] text-foreground/50">.</span>
            <span class="font-mono">{{ s }}</span>
          </button>
          <button
            v-if="canCreate"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            @mousedown.prevent="addClass(query)"
          >
            <IconUi name="plus" size="size-3" :class="isTwUtil ? 'text-purple-fg' : 'text-primary'" />
            <template v-if="isTwUtil">
              <span>Add <span class="font-mono font-medium text-purple-fg">{{ query.trim() }}</span> <span class="text-secondary">· Tailwind</span></span>
            </template>
            <template v-else>
              <span>Create <span class="font-mono font-medium text-primary">{{ query.trim() }}</span></span>
            </template>
          </button>
          <div v-if="!suggestions.length && !canCreate" class="px-2.5 py-1.5 text-[10px] text-secondary">No matching classes</div>
        </template>

        <template v-else>
          <div class="flex items-center gap-2 px-2.5 py-1.5 text-xs text-secondary">
            <IconUi name="plus" size="size-3" />
            <span>Create a class</span>
          </div>

          <!-- Recently used -->
          <template v-if="recentSelectable.length">
            <div class="px-2.5 pb-0.5 pt-1.5 text-[9px] font-mono uppercase tracking-wider text-secondary/50">Recent</div>
            <button
              v-for="c in recentSelectable"
              :key="c"
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @mousedown.prevent="addClass(c)"
            >
              <span class="font-mono text-[10px] text-foreground/50">.</span>
              <span class="font-mono">{{ c }}</span>
            </button>
          </template>
        </template>

        <!-- State selector -->
        <div class="mt-1 border-t border-foreground/8 pt-1.5">
          <div class="px-2.5 pb-1 text-[9px] font-mono uppercase tracking-wider text-secondary/50">State</div>
          <div class="flex flex-wrap gap-1 px-1.5 pb-0.5">
            <button
              v-for="state in STYLE_STATES"
              :key="state.key"
              :class="[
                'rounded-md px-2 py-1 text-[10px] font-mono cursor-pointer transition-colors duration-100',
                activeState === state.key ? 'bg-primary/10 text-primary font-medium' : 'text-secondary hover:bg-secondary/10 hover:text-foreground',
              ]"
              @mousedown.prevent="selectState(state.key)"
            >
              {{ state.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
