<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import { PAGE_TYPE_CONFIGS } from '@/constants/canvas'
import type { PageType } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  mode: 'dashboard' | 'editor' | 'settings'
}>()

const store = useCanvasStore()
const collections = useCollectionsStore()
const router = useRouter()

const isOpen = ref(false)

function goDashboard() {
  router.push('/')
  close()
}
function openEditor() {
  router.push('/editor')
  close()
}
function openSettings() {
  router.push('/settings')
  close()
}
function logout() {
  // TODO: wire to auth
  close()
}

// add page
const isAdding = ref(false)
const newPageName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
// add collection
const isAddingCollection = ref(false)
const newCollectionName = ref('')
const collectionInputRef = ref<HTMLInputElement | null>(null)
// per-collection item flyout
const hovered = ref<string | null>(null)

function badgeColorForType(type: PageType): string {
  switch (type) {
    case 'page': return 'bg-blue-bg text-blue-fg'
    case 'collection': return 'bg-purple-bg text-purple-fg'
    case 'system': return 'bg-muted-bg text-muted-fg'
    default: return 'bg-muted-bg text-muted-fg'
  }
}

// What the trigger button shows depends on the active context.
const context = computed(() => {
  if (store.activeEntry) {
    const col = collections.collectionById(store.activeEntry.collectionId)
    return { badge: col?.singular ?? 'Item', color: 'bg-purple-bg text-purple-fg', name: store.activeEntry.title }
  }
  if (store.isCollectionTemplate) {
    const col = collections.collectionByTemplatePage(store.activePageId)
    return { badge: 'Template', color: 'bg-purple-bg text-purple-fg', name: col?.name ?? store.activePage.name }
  }
  const cfg = PAGE_TYPE_CONFIGS.find((c) => c.key === store.activePage.pageType)
  return { badge: cfg?.label ?? 'Page', color: badgeColorForType(store.activePage.pageType), name: store.activePage.name }
})

// On the dashboard the trigger just reads "Dashboard"; in the editor it
// reflects the active page / collection / item.
const triggerLabel = computed(() => {
  if (props.mode === 'dashboard') return 'Dashboard'
  if (props.mode === 'settings') return 'Settings'
  return context.value.name
})

// Pages tab: regular pages grouped by type (collection templates excluded — no config).
const sections = computed(() =>
  PAGE_TYPE_CONFIGS
    .map((cfg) => ({ config: cfg, pages: store.pagesByType[cfg.key] ?? [] }))
    .filter((s) => s.pages.length > 0),
)

function close() {
  isOpen.value = false
}

watch(isOpen, (open) => {
  if (!open) {
    isAdding.value = false
    newPageName.value = ''
    isAddingCollection.value = false
    newCollectionName.value = ''
    hovered.value = null
  }
})

// --- Pages ---
function selectPage(pageId: string) {
  store.setActivePage(pageId)
  close()
}
function startAdding() {
  isAdding.value = true
  newPageName.value = ''
  requestAnimationFrame(() => inputRef.value?.focus())
}
function confirmAdd() {
  const name = newPageName.value.trim()
  if (!name) return
  store.addPage(name, undefined, 'page')
  close()
}

// --- Collections ---
function openCollection(id: string) {
  store.openCollection(id)
  close()
}
function openEntry(entryId: string) {
  store.openEntry(entryId)
  close()
}
function newItem(collectionId: string) {
  const entry = collections.addEntry(collectionId)
  store.openEntry(entry.id)
  close()
}
function startAddingCollection() {
  isAddingCollection.value = true
  newCollectionName.value = ''
  requestAnimationFrame(() => collectionInputRef.value?.focus())
}
function confirmAddCollection() {
  const name = newCollectionName.value.trim()
  if (!name) return
  const page = store.addPage(name, undefined, 'collection')
  const collection = collections.addCollection({ name, templatePageId: page.id })
  store.openCollection(collection.id)
  close()
}

function handleKeydown(e: KeyboardEvent, confirm: () => void) {
  if (e.key === 'Enter') confirm()
  if (e.key === 'Escape') close()
}
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      class="flex items-center gap-1.5 rounded-xl px-3 h-7 w-48 justify-between text-xs cursor-pointer transition-colors duration-150 hover:bg-secondary/10"
      @click="isOpen = !isOpen"
    >
      <span class="font-medium truncate">{{ triggerLabel }}</span>
      <IconUi name="chevron-down" size="size-3" :class="['shrink-0 text-secondary transition-transform duration-150', isOpen && 'rotate-180']" />
    </button>

    <PopoverUi v-model:open="isOpen" align="left" panel-class="w-64 rounded-2xl p-1.5">
      <!-- App nav -->
      <button
        class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="goDashboard"
      >
        <IconUi name="home" size="size-3.5" class="text-secondary" /> Dashboard
      </button>
      <button
        class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openSettings"
      >
        <IconUi name="settings" size="size-3.5" class="text-secondary" /> Settings
      </button>

      <div class="my-1 border-t border-foreground/8" />

      <!-- Editing surfaces live in the editor only -->
      <template v-if="mode === 'editor'">
      <!-- Pages (grouped by type) -->
      <template v-for="section in sections" :key="section.config.key">
        <div class="px-2.5 pt-1.5 pb-1">
          <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">{{ section.config.plural }}</span>
        </div>
        <button
          v-for="page in section.pages"
          :key="page.id"
          :class="[
            'flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100',
            page.id === store.activePageId && !store.activeEntry ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground hover:bg-secondary/10',
          ]"
          @click="selectPage(page.id)"
        >
          <span class="truncate">{{ page.name }}</span>
          <span class="ml-auto text-[10px] text-secondary/40 font-mono">/{{ page.slug }}</span>
        </button>
      </template>

      <template v-if="isAdding">
        <div class="flex items-center gap-1.5 px-1 py-1">
          <input
            ref="inputRef"
            v-model="newPageName"
            placeholder="Page name"
            class="h-7 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-none"
            @keydown="handleKeydown($event, confirmAdd)"
          />
          <ButtonUi size="sm" @click="confirmAdd">Add</ButtonUi>
        </div>
      </template>
      <button
        v-else
        class="flex w-full items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
        @click="startAdding"
      >
        <IconUi name="plus" size="size-3" /> New page
      </button>

      <div class="my-1 border-t border-foreground/8" />

      <!-- Collections -->
      <div class="px-2.5 pt-1.5 pb-1">
        <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">Collections</span>
      </div>

      <div
        v-for="col in collections.collections"
        :key="col.id"
        class="relative"
        @mouseenter="hovered = col.id"
        @mouseleave="hovered = null"
      >
        <button
          :class="[
            'flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100',
            store.activeCollection?.id === col.id ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground hover:bg-secondary/10',
          ]"
          @click="openCollection(col.id)"
        >
          <span class="truncate">{{ col.name }}</span>
          <span class="ml-auto text-[10px] text-secondary/40 font-mono">{{ collections.entriesByCollection(col.id).length }}</span>
          <IconUi name="chevron-right" size="size-3" class="text-secondary/40" />
        </button>

        <!-- Item flyout -->
        <div v-if="hovered === col.id" class="absolute left-full top-0 z-10 pl-1">
          <div class="w-56 rounded-xl border bg-background p-1 shadow-lg">
            <div class="px-2.5 pt-1 pb-1 text-[9px] font-mono uppercase tracking-wider text-secondary/50">{{ col.plural }}</div>
            <button
              v-for="entry in collections.entriesByCollection(col.id)"
              :key="entry.id"
              :class="[
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors duration-100',
                store.activeEntry?.id === entry.id ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground hover:bg-secondary/10',
              ]"
              @click="openEntry(entry.id)"
            >
              <span class="truncate">{{ entry.title }}</span>
              <span v-if="entry.status === 'draft'" class="ml-auto rounded bg-muted-bg px-1 py-px text-[8px] font-mono uppercase text-muted-fg">draft</span>
            </button>
            <div class="my-1 border-t border-foreground/8" />
            <button
              class="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
              @click="newItem(col.id)"
            >
              <IconUi name="plus" size="size-3" /> New item
            </button>
          </div>
        </div>
      </div>

      <template v-if="isAddingCollection">
        <div class="flex items-center gap-1.5 px-1 py-1">
          <input
            ref="collectionInputRef"
            v-model="newCollectionName"
            placeholder="Collection name"
            class="h-7 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-none"
            @keydown="handleKeydown($event, confirmAddCollection)"
          />
          <ButtonUi size="sm" @click="confirmAddCollection">Add</ButtonUi>
        </div>
      </template>
      <button
        v-else
        class="flex w-full items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
        @click="startAddingCollection"
      >
        <IconUi name="plus" size="size-3" /> New collection
      </button>
      </template>

      <!-- Dashboard: no editing surfaces, just a way into the editor -->
      <button
        v-else
        class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="openEditor"
      >
        <IconUi name="rename" size="size-3.5" class="text-secondary" /> Open editor
      </button>

      <div class="my-1 border-t border-foreground/8" />

      <button
        class="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-foreground cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="logout"
      >
        <IconUi name="logout" size="size-3.5" class="text-secondary" /> Logout
      </button>
    </PopoverUi>
  </div>
</template>
