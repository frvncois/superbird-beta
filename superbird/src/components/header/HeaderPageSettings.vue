<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import type { PageSeo } from '@/types/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()

const open = ref(false)

// What the settings edit: the active item, else the active collection template,
// else the active page.
const kind = computed<'entry' | 'collection' | 'page'>(() => {
  if (store.activeEntry) return 'entry'
  if (store.isCollectionTemplate && store.activeCollection) return 'collection'
  return 'page'
})

const title = computed({
  get: () =>
    kind.value === 'entry'
      ? store.activeEntry!.title
      : kind.value === 'collection'
        ? store.activeCollection!.name
        : store.activePage.name,
  set: (v: string) => {
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { title: v })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { name: v })
    else store.updatePage(store.activePageId, { name: v })
  },
})

const slug = computed({
  get: () =>
    kind.value === 'entry'
      ? store.activeEntry!.slug
      : kind.value === 'collection'
        ? store.activeCollection!.basePath
        : store.activePage.slug,
  set: (v: string) => {
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { slug: v })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { basePath: v })
    else store.updatePage(store.activePageId, { slug: v })
  },
})

const status = computed({
  get: () =>
    kind.value === 'entry'
      ? store.activeEntry!.status
      : kind.value === 'collection'
        ? (store.activeCollection!.status ?? 'published')
        : (store.activePage.status ?? 'published'),
  set: (v: string) => {
    const s = v as 'draft' | 'published'
    if (kind.value === 'entry') collections.updateEntry(store.activeEntry!.id, { status: s })
    else if (kind.value === 'collection') collections.updateCollection(store.activeCollection!.id, { status: s })
    else store.updatePage(store.activePageId, { status: s })
  },
})

const slugPrefix = computed(() => (kind.value === 'collection' ? '' : '/'))

// Per-page SEO (pages only).
const seo = computed(() => store.activePage.seo ?? {})
function updateSeo(patch: Partial<PageSeo>) {
  store.updatePage(store.activePageId, { seo: { ...(store.activePage.seo ?? {}), ...patch } })
}
</script>

<template>
  <div class="relative">
    <ButtonUi
      variant="ghost"
      size="sm"
      icon="settings"
      title="Page settings"
      class="size-7 px-0"
      :class="open ? 'bg-secondary/10' : 'text-secondary'"
      @click="open = !open"
    />

    <PopoverUi v-model:open="open" align="left" panel-class="w-72 rounded-2xl p-3">
      <div class="space-y-3">
        <!-- Status -->
        <div class="flex items-center justify-between gap-2">
          <LabelUi>Status</LabelUi>
          <SegmentedControlUi
            v-model="status"
            size="xs"
            :options="[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]"
          />
        </div>

        <!-- Title -->
        <div class="space-y-1">
          <LabelUi>Title</LabelUi>
          <InputUi v-model="title" placeholder="Title" />
        </div>

        <!-- Slug -->
        <div class="space-y-1">
          <LabelUi>{{ kind === 'collection' ? 'Base path' : 'Slug' }}</LabelUi>
          <div class="flex items-center gap-1">
            <span v-if="slugPrefix" class="font-mono text-xs text-secondary/50">{{ slugPrefix }}</span>
            <InputUi v-model="slug" placeholder="slug" class="flex-1 font-mono" />
          </div>
        </div>

        <!-- SEO (pages only) -->
        <template v-if="kind === 'page'">
          <div class="border-t border-foreground/8 pt-3 space-y-3">
            <LabelUi>SEO</LabelUi>
            <div class="space-y-1">
              <span class="text-[10px] text-secondary">Meta title</span>
              <InputUi
                :model-value="seo.title ?? ''"
                :placeholder="title"
                @update:model-value="updateSeo({ title: $event || undefined })"
              />
            </div>
            <div class="space-y-1">
              <span class="text-[10px] text-secondary">Meta description</span>
              <TextareaUi
                :model-value="seo.description ?? ''"
                placeholder="Description for search engines"
                :rows="2"
                @update:model-value="updateSeo({ description: $event || undefined })"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-foreground">Hide from search</span>
              <ToggleUi
                :model-value="seo.noIndex ?? false"
                @update:model-value="updateSeo({ noIndex: $event || undefined })"
              />
            </div>
          </div>
        </template>
      </div>
    </PopoverUi>
  </div>
</template>
