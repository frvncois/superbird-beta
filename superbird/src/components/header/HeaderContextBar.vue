<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import { PAGE_TYPE_CONFIGS } from '@/constants/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import HeaderViewportSwitch from './HeaderViewportSwitch.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()

// What the bar edits: the active item, else the active collection (its
// template), else the active page.
const kind = computed<'entry' | 'collection' | 'page'>(() => {
  if (store.activeEntry) return 'entry'
  if (store.isCollectionTemplate && store.activeCollection) return 'collection'
  return 'page'
})

const badge = computed(() => {
  if (kind.value === 'entry') return store.activeCollection?.singular ?? 'Item'
  if (kind.value === 'collection') return 'Collection'
  const cfg = PAGE_TYPE_CONFIGS.find((c) => c.key === store.activePage.pageType)
  return cfg?.label ?? 'Page'
})

const badgeColor = computed(() =>
  kind.value === 'page' ? 'bg-blue-bg text-blue-fg' : 'bg-purple-bg text-purple-fg',
)

const title = computed({
  get: () => {
    if (kind.value === 'entry') return store.activeEntry!.title
    if (kind.value === 'collection') return store.activeCollection!.name
    return store.activePage.name
  },
  set: (v: string) => {
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { title: v })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { name: v })
    else store.updatePage(store.activePageId, { name: v })
  },
})

const slug = computed({
  get: () => {
    if (kind.value === 'entry') return store.activeEntry!.slug
    if (kind.value === 'collection') return store.activeCollection!.basePath
    return store.activePage.slug
  },
  set: (v: string) => {
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { slug: v })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { basePath: v })
    else store.updatePage(store.activePageId, { slug: v })
  },
})

const status = computed({
  get: () => {
    if (kind.value === 'entry') return store.activeEntry!.status
    if (kind.value === 'collection') return store.activeCollection!.status ?? 'published'
    return store.activePage.status ?? 'published'
  },
  set: (v: string) => {
    const s = v as 'draft' | 'published'
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { status: s })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { status: s })
    else store.updatePage(store.activePageId, { status: s })
  },
})

function backToTemplate() {
  if (store.activeCollection) store.openCollection(store.activeCollection.id)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <span :class="['rounded px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase', badgeColor]">
      {{ badge }}
    </span>

    <div class="flex items-center gap-1.5">
      <span class="text-[10px] font-mono uppercase tracking-wider text-secondary/60">Title</span>
      <div class="w-48"><InputUi v-model="title" size="xs" placeholder="Title" /></div>
    </div>

    <div class="flex items-center gap-1.5">
      <span class="text-[10px] font-mono text-secondary/40">/</span>
      <div class="w-32"><InputUi v-model="slug" size="xs" placeholder="slug" /></div>
    </div>

    <SegmentedControlUi
      v-model="status"
      size="xs"
      :options="[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]"
    />

    <!-- Back to the collection template (only while editing an item) -->
    <button
      v-if="kind === 'entry'"
      class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
      @click="backToTemplate"
    >
      <IconUi name="chevron-down" size="size-3" class="rotate-90" /> Template
    </button>

    <div class="h-4 w-px bg-border" />

    <!-- Viewport selector (always) -->
    <HeaderViewportSwitch />
  </div>
</template>
