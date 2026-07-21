<script setup lang="ts">
import { ref, computed } from 'vue'
import { STYLE_STATES } from '@/constants/canvas'
import type { StyleState } from '@/types/canvas'

const props = defineProps<{
  classes: string[]
  activeClass: string | null
  activeState: StyleState
  allClassNames: string[]
}>()

const emit = defineEmits<{
  add: [name: string]
  remove: [name: string]
  select: [name: string]
  'update:activeState': [state: StyleState]
}>()

const query = ref('')
const isFocused = ref(false)
const stateOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const showDropdown = computed(() => isFocused.value && query.value.length > 0)

const currentStateLabel = computed(() =>
  STYLE_STATES.find((s) => s.key === props.activeState)?.label ?? 'State',
)

const suggestions = computed(() => {
  if (!query.value) return []
  const q = query.value.toLowerCase()
  return props.allClassNames
    .filter((n) => n.toLowerCase().includes(q) && !props.classes.includes(n))
    .slice(0, 6)
})

const canCreate = computed(() => {
  if (!query.value.trim()) return false
  const q = query.value.trim().toLowerCase()
  return !props.allClassNames.some((n) => n.toLowerCase() === q)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && query.value.trim()) {
    e.preventDefault()
    emit('add', query.value.trim())
    query.value = ''
  }
  if (e.key === 'Backspace' && !query.value && props.classes.length > 0) {
    emit('remove', props.classes[props.classes.length - 1]!)
  }
  if (e.key === 'Escape') {
    query.value = ''
    inputRef.value?.blur()
  }
}

function pickSuggestion(name: string) {
  emit('add', name)
  query.value = ''
  inputRef.value?.focus()
}

function focusInput() {
  inputRef.value?.focus()
}

function handleBlur() {
  setTimeout(() => { isFocused.value = false }, 150)
}

function toggleState(e: MouseEvent) {
  e.stopPropagation()
  stateOpen.value = !stateOpen.value
}

function selectState(state: StyleState) {
  emit('update:activeState', state)
  stateOpen.value = false
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center gap-1.5">
      <!-- Class input -->
      <div
        :class="[
          'flex flex-1 flex-wrap items-center gap-1 min-h-8 px-1 py-0.5 rounded-xl border cursor-text transition-colors duration-150',
          isFocused
            ? 'border-foreground/40 outline-3 outline-secondary/10'
            : 'border-foreground/15 hover:border-foreground/25',
        ]"
        @click="focusInput"
      >
        <!-- Class badges -->
        <button
          v-for="cls in classes"
          :key="cls"
          :class="[
            'group inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-mono leading-tight cursor-pointer transition-colors duration-100 shrink-0',
            activeClass === cls
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15',
          ]"
          @click.stop="emit('select', cls)"
        >
          {{ cls }}
          <svg
            class="size-2.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            @click.stop="emit('remove', cls)"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        <!-- Text input -->
        <input
          ref="inputRef"
          v-model="query"
          placeholder="Add class..."
          class="flex-1 min-w-[60px] bg-transparent text-xs text-foreground placeholder:text-foreground/30 outline-none h-5"
          @focus="isFocused = true"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
      </div>

      <!-- State mini-dropdown -->
      <div v-if="activeClass" class="relative shrink-0">
        <button
          :class="[
            'flex items-center gap-0.5 h-8 px-2 rounded-xl border text-[10px] font-mono cursor-pointer transition-colors duration-150',
            activeState !== 'default'
              ? 'border-primary/30 bg-primary/8 text-primary'
              : 'border-foreground/15 text-secondary hover:border-foreground/25 hover:text-foreground',
          ]"
          @click="toggleState"
        >
          {{ currentStateLabel }}
          <svg
            :class="['size-2.5 transition-transform duration-150', stateOpen && 'rotate-180']"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- State backdrop -->
        <div v-if="stateOpen" class="fixed inset-0 z-40" @click="stateOpen = false" />

        <!-- State dropdown -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="stateOpen"
            class="absolute left-0 top-full mt-1 z-50 w-28 rounded-xl border bg-background p-1 shadow-lg"
          >
            <button
              v-for="state in STYLE_STATES"
              :key="state.key"
              :class="[
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-mono cursor-pointer transition-colors duration-100',
                activeState === state.key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-secondary/10',
              ]"
              @click="selectState(state.key)"
            >
              {{ state.label }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Autocomplete dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="showDropdown"
        class="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border bg-background p-1 shadow-lg"
      >
        <button
          v-for="s in suggestions"
          :key="s"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
          @mousedown.prevent="pickSuggestion(s)"
        >
          <span class="font-mono text-[10px] text-foreground/60">.</span>
          <span>{{ s }}</span>
        </button>

        <button
          v-if="canCreate"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
          @mousedown.prevent="emit('add', query.trim()); query = ''"
        >
          <svg class="size-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          <span>Create <span class="font-mono font-medium text-primary">{{ query.trim() }}</span></span>
        </button>

        <div v-if="suggestions.length === 0 && !canCreate" class="px-2.5 py-1.5 text-[10px] text-secondary">
          No matching classes
        </div>
      </div>
    </Transition>
  </div>
</template>
