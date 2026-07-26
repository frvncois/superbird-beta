<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import { PAGE_TYPE_CONFIGS } from '@/constants/canvas'
import type { Page } from '@/types/canvas'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import HeaderPageSettings from './HeaderPageSettings.vue'
import HeaderViewportSwitch from './HeaderViewportSwitch.vue'
import HeaderLocaleSwitch from './HeaderLocaleSwitch.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()

// Pages / collections navigation dropdown.
const pagesOpen = ref(false)

// Trigger label reflects the active page / collection / item.
const label = computed(() => {
  if (store.activeEntry) return store.activeEntry.title
  if (store.isCollectionTemplate) return store.activeCollection?.name ?? store.activePage.name
  return store.activePage.name
})

// User-created pages get the "New page" affordance directly under them. Other
// page types (System) are auto-generated — listed, but never created here.
const pagePages = computed(() => store.pagesByType['page'] ?? [])
const otherSections = computed(() =>
  PAGE_TYPE_CONFIGS.filter((c) => c.key !== 'page')
    .map((cfg) => ({ config: cfg, pages: store.pagesByType[cfg.key] ?? [] }))
    .filter((s) => s.pages.length > 0),
)

// The only system page is the 404 / not-found page.
function systemIcon(_page: Page): string {
  return 'alert'
}

function close() {
  pagesOpen.value = false
}

function selectPage(pageId: string) {
  store.setActivePage(pageId)
  close()
}
function openCollection(id: string) {
  store.openCollection(id)
  close()
}
function openEntry(entryId: string) {
  store.openEntry(entryId)
  close()
}
// New item is an inline title flow inside the flyout (mirrors New page/collection).
const addingItem = ref(false)
const newItemTitle = ref('')
const newItemInput = ref<{ focus: () => void } | null>(null)
function startAddItem() {
  keepFlyout()
  addingItem.value = true
  newItemTitle.value = ''
  requestAnimationFrame(() => newItemInput.value?.focus())
}
function confirmAddItem() {
  const col = hoveredCollection.value
  if (!col) return
  const entry = collections.addEntry(col.id, newItemTitle.value)
  store.openEntry(entry.id)
  close()
}
function onItemKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') confirmAddItem()
  if (e.key === 'Escape') addingItem.value = false
}

// Add page
const isAdding = ref(false)
const newPageName = ref('')
const inputRef = ref<{ focus: () => void } | null>(null)
function startAdding() {
  isAdding.value = true
  newPageName.value = ''
  requestAnimationFrame(() => inputRef.value?.focus())
}
function confirmAdd() {
  const name = newPageName.value.trim()
  if (!name) return
  const page = store.addPage(name, undefined, 'page')
  store.setActivePage(page.id)
  close()
}

// Add collection
const isAddingCollection = ref(false)
const newCollectionName = ref('')
const collectionInputRef = ref<{ focus: () => void } | null>(null)
function startAddingCollection() {
  isAddingCollection.value = true
  newCollectionName.value = ''
  requestAnimationFrame(() => collectionInputRef.value?.focus())
}
function confirmAddCollection() {
  const name = newCollectionName.value.trim()
  if (!name) return
  const page = store.addPage(name, undefined, 'collection')
  const collection = collections.addCollection({
    name,
    templatePageId: page.id,
  })
  store.openCollection(collection.id)
  close()
}

function handleKeydown(e: KeyboardEvent, confirm: () => void) {
  if (e.key === 'Enter') confirm()
  if (e.key === 'Escape') close()
}

// Collection → items flyout. Teleported to <body> so it escapes DropdownUi's
// clipped panel; positioned from the hovered row's viewport rect. A short close
// delay (hover-intent) lets the pointer cross the gap into the flyout.
const hovered = ref<string | null>(null)
const flyoutStyle = ref<Record<string, string>>({})
const hoveredCollection = computed(() => collections.collections.find((c) => c.id === hovered.value) ?? null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openFlyout(e: MouseEvent, colId: string) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (hovered.value !== colId) addingItem.value = false
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  flyoutStyle.value = { position: 'fixed', left: `${rect.right + 4}px`, top: `${rect.top}px`, zIndex: '60' }
  hovered.value = colId
}
function scheduleCloseFlyout() {
  if (addingItem.value) return // pinned open while naming a new item
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    hovered.value = null
  }, 120)
}
function keepFlyout() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

// Reset transient state whenever the dropdown closes.
watch(pagesOpen, (open) => {
  if (!open) {
    isAdding.value = false
    newPageName.value = ''
    isAddingCollection.value = false
    newCollectionName.value = ''
    addingItem.value = false
    newItemTitle.value = ''
    hovered.value = null
  }
})

// Design / Content editor mode.
const editorModeOptions = [
  { value: 'design', label: 'Design' },
  { value: 'content', label: 'Content' },
]

// Back to the collection template (only while editing an item).
function backToTemplate() {
  if (store.activeCollection) store.openCollection(store.activeCollection.id)
}
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <!-- Pages / collections navigation -->
    <DropdownUi v-model:open="pagesOpen" class="w-64" panel-class="!max-h-[80vh]">
      <template #trigger="{ open, toggle }">
        <button
          class="flex h-8 w-full items-center justify-between gap-1.5 px-3 text-xs font-medium cursor-pointer"
          @click="toggle"
        >
          <span class="truncate">{{ label }}</span>
          <IconUi
            name="chevron-down"
            size="size-3"
            :class="['shrink-0 text-secondary transition-transform duration-150', open && 'rotate-180']"
          />
        </button>
      </template>

      <!-- Pages (user-created) -->
      <div class="px-2.5 pb-1 pt-0.5">
        <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">Pages</span>
      </div>
      <ButtonUi
        v-for="page in pagePages"
        :key="page.id"
        variant="ghost"
        size="sm"
        align="start"
        icon="document"
        class="w-full"
        :active="page.id === store.activePageId && !store.activeEntry"
        @click="selectPage(page.id)"
      >
        <span class="truncate">{{ page.name }}</span>
      </ButtonUi>

      <!-- New page (regular pages only — System pages are auto-generated) -->
      <template v-if="isAdding">
        <div class="flex items-center gap-1.5 px-1 py-1">
          <InputUi
            ref="inputRef"
            v-model="newPageName"
            placeholder="Page name"
            size="xs"
            class="flex-1"
            @keydown="handleKeydown($event, confirmAdd)"
          />
          <ButtonUi size="sm" @click="confirmAdd">Add</ButtonUi>
        </div>
      </template>
      <ButtonUi
        v-else
        variant="ghost"
        size="sm"
        align="start"
        icon="plus"
        class="w-full"
        @click="startAdding"
      >
        New page
      </ButtonUi>

      <!-- Other page types (System — auto-generated) -->
      <template v-for="section in otherSections" :key="section.config.key">
        <div class="px-2.5 pb-1 pt-0.5">
          <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">{{ section.config.plural }}</span>
        </div>
        <ButtonUi
          v-for="page in section.pages"
          :key="page.id"
          variant="ghost"
          size="sm"
          align="start"
          :icon="systemIcon(page)"
          class="w-full"
          :active="page.id === store.activePageId && !store.activeEntry"
          @click="selectPage(page.id)"
        >
          <span class="truncate">{{ page.name }}</span>
        </ButtonUi>
      </template>

      <div class="my-1 border-t border-foreground/8" />

      <!-- Collections -->
      <div class="px-2.5 pb-1 pt-0.5">
        <span class="text-[9px] font-mono uppercase tracking-wider text-secondary/50">Collections</span>
      </div>
      <ButtonUi
        v-for="col in collections.collections"
        :key="col.id"
        variant="ghost"
        size="sm"
        align="start"
        icon="collection"
        class="w-full"
        :active="store.activeCollection?.id === col.id"
        @click="openCollection(col.id)"
        @mouseenter="openFlyout($event, col.id)"
        @mouseleave="scheduleCloseFlyout"
      >
        <span class="truncate">{{ col.name }}</span>
        <IconUi name="chevron-right" size="size-3" class="ml-auto text-secondary/40" />
      </ButtonUi>

      <template v-if="isAddingCollection">
        <div class="flex items-center gap-1.5 px-1 py-1">
          <InputUi
            ref="collectionInputRef"
            v-model="newCollectionName"
            placeholder="Collection name"
            size="xs"
            class="flex-1"
            @keydown="handleKeydown($event, confirmAddCollection)"
          />
          <ButtonUi size="sm" @click="confirmAddCollection">Add</ButtonUi>
        </div>
      </template>
      <ButtonUi
        v-else
        variant="ghost"
        size="sm"
        align="start"
        icon="plus"
        class="w-full"
        @click="startAddingCollection"
      >
        New collection
      </ButtonUi>
    </DropdownUi>

    <!-- Collection items flyout — teleported out of the clipped dropdown panel.
         `data-dropdown-keep` tells DropdownUi's outside-click to ignore presses
         in here, so its buttons/input don't close the parent dropdown. -->
    <Teleport to="body">
      <div
        v-if="hovered && hoveredCollection"
        :style="flyoutStyle"
        data-dropdown-keep
        @mouseenter="keepFlyout"
        @mouseleave="scheduleCloseFlyout"
      >
        <div class="w-56 rounded-xl border bg-background p-1 shadow-lg">
          <div class="px-2.5 pb-1 pt-1 text-[9px] font-mono uppercase tracking-wider text-secondary/50">
            {{ hoveredCollection.plural }}
          </div>
          <ButtonUi
            v-for="entry in collections.entriesByCollection(hoveredCollection.id)"
            :key="entry.id"
            variant="ghost"
            size="sm"
            align="start"
            class="w-full"
            :active="store.activeEntry?.id === entry.id"
            @click="openEntry(entry.id)"
          >
            <span class="truncate">{{ entry.title }}</span>
            <span v-if="entry.status === 'draft'" class="ml-auto rounded bg-muted-bg px-1 py-px text-[8px] font-mono uppercase text-muted-fg">draft</span>
          </ButtonUi>

          <div class="my-1 border-t border-foreground/8" />

          <!-- New item: inline title flow (mirrors New page / New collection) -->
          <div v-if="addingItem" class="flex items-center gap-1.5 px-1 py-1">
            <InputUi
              ref="newItemInput"
              v-model="newItemTitle"
              placeholder="Item title"
              size="xs"
              class="flex-1"
              @keydown="onItemKeydown"
            />
            <ButtonUi size="sm" @click="confirmAddItem">Add</ButtonUi>
          </div>
          <ButtonUi
            v-else
            variant="ghost"
            size="sm"
            align="start"
            icon="plus"
            class="w-full"
            @click="startAddItem"
          >
            New item
          </ButtonUi>
        </div>
      </div>
    </Teleport>

    <!-- Page settings (status, title, slug, SEO) -->
    <HeaderPageSettings />

    <!-- Back to the collection template (only while editing an item) -->
    <ButtonUi
      v-if="store.activeEntry"
      variant="ghost"
      size="sm"
      @click="backToTemplate"
    >
      <IconUi name="chevron-down" size="size-3" class="rotate-90" /> Template
    </ButtonUi>
    <HeaderLocaleSwitch />
    <HeaderViewportSwitch />
    <SegmentedControlUi
      :model-value="store.editorMode"
      :options="editorModeOptions"
      @update:model-value="store.setEditorMode($event as 'design' | 'content')"
    />
  </div>
</template>
