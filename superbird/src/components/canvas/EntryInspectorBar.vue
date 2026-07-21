<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

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
  <!-- Editing a specific item -->
  <div v-if="entry" class="flex items-center gap-3 border-b bg-purple-bg/20 px-4 py-2">
    <span class="rounded bg-purple-bg px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase text-purple-fg">
      {{ collection?.singular ?? 'Item' }}
    </span>
    <div class="flex items-center gap-1.5">
      <span class="text-[10px] font-mono uppercase tracking-wider text-secondary/60">Title</span>
      <div class="w-56"><InputUi v-model="title" size="xs" placeholder="Item title" /></div>
    </div>
    <div class="flex items-center gap-1.5">
      <span class="text-[10px] font-mono text-secondary/40">/</span>
      <div class="w-40"><InputUi v-model="slug" size="xs" placeholder="slug" /></div>
    </div>
    <div class="ml-auto flex items-center gap-3">
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
    </div>
  </div>

  <!-- Editing the template (no item loaded) -->
  <div v-else-if="store.isCollectionTemplate" class="flex items-center gap-2 border-b bg-secondary/5 px-4 py-1.5 text-[11px] text-secondary">
    <IconUi name="layers" size="size-3" class="text-secondary/50" />
    Editing the <span class="font-medium text-foreground">{{ collection?.name ?? 'collection' }}</span> template — changes apply to all items.
  </div>
</template>
