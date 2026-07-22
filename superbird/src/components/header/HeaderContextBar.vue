<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import HeaderViewportSwitch from './HeaderViewportSwitch.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()

const entry = computed(() => store.activeEntry)
const collection = computed(() => store.activeCollection)

const title = computed({
  get: () => entry.value?.title ?? '',
  set: (v: string) => { if (entry.value) collections.updateEntry(entry.value.id, { title: v }) },
})
const slug = computed({
  get: () => entry.value?.slug ?? '',
  set: (v: string) => { if (entry.value) collections.updateEntry(entry.value.id, { slug: v }) },
})
const status = computed({
  get: () => entry.value?.status ?? 'draft',
  set: (v: string) => { if (entry.value) collections.updateEntry(entry.value.id, { status: v as 'draft' | 'published' }) },
})

function backToTemplate() {
  if (collection.value) store.openCollection(collection.value.id)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Entry controls (only when an item is loaded) -->
    <template v-if="entry">
      <span class="rounded bg-purple-bg px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase text-purple-fg">
        {{ collection?.singular ?? 'Item' }}
      </span>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] font-mono uppercase tracking-wider text-secondary/60">Title</span>
        <div class="w-48"><InputUi v-model="title" size="xs" placeholder="Item title" /></div>
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
      <button
        class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
        @click="backToTemplate"
      >
        <IconUi name="chevron-down" size="size-3" class="rotate-90" /> Template
      </button>
      <div class="h-4 w-px bg-border" />
    </template>

    <!-- Viewport selector (always) -->
    <HeaderViewportSwitch />
  </div>
</template>
