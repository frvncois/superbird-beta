<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { PAGE_TYPE_CONFIGS } from '@/constants/canvas'
import type { PageType } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

const store = useCanvasStore()
const isOpen = ref(false)
const isAdding = ref(false)
const addingType = ref<PageType>('page')
const newPageName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const typeLabel = computed(() => {
  const cfg = PAGE_TYPE_CONFIGS.find((c) => c.key === store.activePage.pageType)
  return cfg?.label ?? 'Page'
})

const typeBadgeColor = computed(() => badgeColorForType(store.activePage.pageType))

function badgeColorForType(type: PageType): string {
  switch (type) {
    case 'page': return 'bg-blue-bg text-blue-fg'
    case 'collection': return 'bg-purple-bg text-purple-fg'
    case 'system': return 'bg-muted-bg text-muted-fg'
    default: return 'bg-muted-bg text-muted-fg'
  }
}

const sections = computed(() =>
  PAGE_TYPE_CONFIGS
    .map((cfg) => ({
      config: cfg,
      pages: store.pagesByType[cfg.key] ?? [],
    }))
    .filter((s) => s.pages.length > 0),
)

function toggle() {
  isOpen.value = !isOpen.value
  isAdding.value = false
}

function close() {
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    isAdding.value = false
    newPageName.value = ''
  }
})

function selectPage(pageId: string) {
  store.setActivePage(pageId)
  close()
}

function startAdding(type: PageType) {
  addingType.value = type
  isAdding.value = true
  newPageName.value = ''
  requestAnimationFrame(() => inputRef.value?.focus())
}

function confirmAdd() {
  const name = newPageName.value.trim()
  if (!name) return
  store.addPage(name, undefined, addingType.value)
  close()
}

function handleAddKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') confirmAdd()
  if (e.key === 'Escape') close()
}
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      class="flex items-center gap-1.5 rounded-xl px-3 h-7 text-xs cursor-pointer transition-colors duration-150 hover:bg-secondary/10"
      @click="toggle"
    >
      <span :class="['rounded px-1 py-px text-[9px] font-mono font-medium', typeBadgeColor]">
        {{ typeLabel }}
      </span>
      <span class="font-medium">{{ store.activePage.name }}</span>
      <svg
        :class="['size-3 text-secondary transition-transform duration-150', isOpen && 'rotate-180']"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <PopoverUi v-model:open="isOpen" align="left" panel-class="w-64 max-h-[70vh] overflow-y-auto rounded-2xl p-1.5">
      <div>
        <!-- Grouped sections -->
        <template v-for="(section, sIdx) in sections" :key="section.config.key">
          <div v-if="sIdx > 0" class="my-1 border-t border-foreground/8" />

          <!-- Section header -->
          <div class="flex items-center justify-between px-2.5 pt-1.5 pb-1">
            <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">
              {{ section.config.plural }}
            </span>
            <button
              class="flex items-center gap-0.5 text-[9px] text-secondary/50 cursor-pointer hover:text-foreground transition-colors duration-100"
              @click="startAdding(section.config.key)"
            >
              <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add
            </button>
          </div>

          <!-- Page list -->
          <button
            v-for="page in section.pages"
            :key="page.id"
            :class="[
              'flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100',
              page.id === store.activePageId
                ? 'bg-primary/10 text-foreground font-medium'
                : 'text-foreground hover:bg-secondary/10',
            ]"
            @click="selectPage(page.id)"
          >
            <span class="truncate">{{ page.name }}</span>
            <span class="ml-auto text-[10px] text-secondary/40 font-mono">/{{ page.slug }}</span>
          </button>
        </template>

        <!-- Add page inline -->
        <template v-if="isAdding">
          <div class="my-1 border-t border-foreground/8" />
          <div class="px-1 py-1">
            <div class="mb-1 flex items-center gap-1">
              <span :class="['rounded px-1 py-px text-[8px] font-mono font-medium', badgeColorForType(addingType)]">
                {{ PAGE_TYPE_CONFIGS.find((c) => c.key === addingType)?.label }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <input
                ref="inputRef"
                v-model="newPageName"
                placeholder="Page name"
                class="h-7 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-none"
                @keydown="handleAddKeydown"
              />
              <ButtonUi size="sm" @click="confirmAdd">Add</ButtonUi>
            </div>
          </div>
        </template>
      </div>
    </PopoverUi>
  </div>
</template>
