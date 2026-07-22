<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { STYLE_STATES } from '@/constants/canvas'
import { isTailwindUtility } from '@/lib/tailwindToStyles'
import type { StyleState } from '@/types/canvas'
import IconUi from './IconUi.vue'
import PopoverUi from './PopoverUi.vue'

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
// Parent sets this to a class name to open it directly in inline-rename mode
// (used right after Duplicate). Cleared back to null once consumed.
const renameTarget = defineModel<string | null>('renameTarget', { default: null })

const emit = defineEmits<{
  add: [name: string]
  remove: [name: string]
  select: [name: string]
  delete: [name: string]
  duplicate: [name: string]
  rename: [oldName: string, newName: string]
}>()

const query = ref('')
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Per-chip menu + inline rename (transient interaction state).
const menuFor = ref<string | null>(null)
const renaming = ref<string | null>(null)
const renameValue = ref('')
const renameRef = ref<HTMLInputElement | null>(null)
function setRenameRef(el: HTMLInputElement | null) {
  renameRef.value = el
}

// A chip is a real, editable style class iff it's in the registry. Tailwind
// utilities never are — they can only be removed, not deleted/duplicated/renamed.
function isCustomClass(cls: string): boolean {
  return props.allClassNames.includes(cls)
}

function openMenu(cls: string) {
  menuFor.value = menuFor.value === cls ? null : cls
}
function closeMenu() {
  menuFor.value = null
}

function startRename(cls: string) {
  closeMenu()
  renaming.value = cls
  renameValue.value = cls
  nextTick(() => {
    renameRef.value?.focus()
    renameRef.value?.select()
  })
}
function commitRename() {
  const from = renaming.value
  const to = renameValue.value.trim()
  renaming.value = null
  if (!from || !to || to === from) return
  if (props.allClassNames.includes(to)) return
  emit('rename', from, to)
}
function cancelRename() {
  renaming.value = null
}

// Consume a rename request from the parent (post-duplicate).
watch(renameTarget, (t) => {
  if (!t) return
  renameTarget.value = null
  startRename(t)
})

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
    <!-- Click-away for the chip menu -->
    <div v-if="menuFor" class="fixed inset-0 z-[55]" @click="closeMenu" />

    <!-- Chips + input -->
    <div
      :class="[
        'flex flex-wrap items-center gap-1 min-h-8 px-1 py-0.5 rounded-xl border cursor-text transition-colors duration-150',
        isFocused ? 'border-foreground/40 outline-3 outline-secondary/10' : 'border-foreground/15 hover:border-foreground/25',
      ]"
      @click="focusInput"
    >
      <div v-for="cls in classes" :key="cls" class="relative shrink-0">
        <!-- Inline rename -->
        <input
          v-if="renaming === cls"
          :ref="(el) => setRenameRef(el as HTMLInputElement | null)"
          v-model="renameValue"
          class="rounded-md px-2.5 py-1 text-[10px] font-mono leading-tight bg-primary/15 text-primary outline-none ring-1 ring-primary/40 w-[--rename-w] min-w-[40px]"
          :style="{ '--rename-w': (renameValue.length + 1) + 'ch' }"
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="cancelRename"
          @blur="commitRename"
          @click.stop
        />

        <!-- Chip -->
        <div
          v-else
          :class="[
            'inline-flex items-center rounded-md text-[10px] font-mono leading-tight transition-colors duration-100',
            activeClass === cls ? 'bg-primary/15 text-primary' : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15',
          ]"
        >
          <button class="pl-2.5 pr-1 py-1 cursor-pointer" @click.stop="emit('select', cls)">
            {{ cls }}
          </button>
          <button
            class="pr-1.5 pl-0.5 py-1 cursor-pointer opacity-60 hover:opacity-100"
            :aria-label="`${cls} options`"
            @click.stop="openMenu(cls)"
          >
            <IconUi name="chevron-down" size="size-2.5" />
          </button>
        </div>

        <!-- Chip menu -->
        <div
          v-if="menuFor === cls"
          class="absolute right-0 top-full z-[60] mt-1 w-36 rounded-xl border bg-background p-1 shadow-lg"
          @click.stop
        >
          <button
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            @click="emit('remove', cls); closeMenu()"
          >
            <IconUi name="close" size="size-3" class="text-secondary" />
            Remove class
          </button>
          <template v-if="isCustomClass(cls)">
            <button
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @click="startRename(cls)"
            >
              <IconUi name="rename" size="size-3" class="text-secondary" />
              Rename class
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @click="emit('duplicate', cls); closeMenu()"
            >
              <IconUi name="duplicate" size="size-3" class="text-secondary" />
              Duplicate class
            </button>
            <button
              class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-fg cursor-pointer hover:bg-red-bg/40 transition-colors duration-100"
              @click="emit('delete', cls); closeMenu()"
            >
              <IconUi name="delete" size="size-3" />
              Delete class
            </button>
          </template>
        </div>
      </div>

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

    <!-- Dropdown (on focus; no backdrop — the field stays typable) -->
    <PopoverUi v-model:open="isFocused" align="full" :backdrop="false" panel-class="p-1">
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
    </PopoverUi>
  </div>
</template>
