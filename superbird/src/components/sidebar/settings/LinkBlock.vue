<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useCollectionsStore } from '@/stores/collections'
import type { NodeLink, Page } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const collections = useCollectionsStore()
const node = computed(() => store.selectedNode)

const linkType = ref<'url' | 'page' | 'post'>('url')

const typeOptions = [
  { value: 'url', label: 'Custom URL' },
  { value: 'page', label: 'Page' },
  { value: 'post', label: 'Post' },
]
const targetOptions = [
  { value: '_self', label: 'Same tab' },
  { value: '_blank', label: 'New tab' },
]

function pagePath(p: Page): string {
  return p.slug === '/' ? '/' : `/${p.slug.replace(/^\//, '')}`
}

// Selectable destinations.
const pageOptions = computed(() => [
  { value: '', label: 'Select a page…' },
  ...store.pages.filter((p) => p.pageType !== 'collection').map((p) => ({ value: pagePath(p), label: p.name })),
])
const postOptions = computed(() => {
  const opts = [{ value: '', label: 'Select a post…' }]
  for (const col of collections.collections) {
    for (const entry of collections.entriesByCollection(col.id)) {
      opts.push({ value: `/${col.basePath}/${entry.slug}`, label: `${col.singular}: ${entry.title}` })
    }
  }
  return opts
})

// Infer the link type from the stored URL when the selection changes.
watch(
  () => node.value?.id,
  () => {
    const url = node.value?.link?.url
    if (!url) {
      linkType.value = 'url'
    } else if (pageOptions.value.some((o) => o.value && o.value === url)) {
      linkType.value = 'page'
    } else if (postOptions.value.some((o) => o.value && o.value === url)) {
      linkType.value = 'post'
    } else {
      linkType.value = 'url'
    }
  },
  { immediate: true },
)

function updateLink(partial: Partial<NodeLink>) {
  if (!node.value) return
  store.setNodeSettings(node.value.id, { link: { ...(node.value.link ?? {}), ...partial } })
}
</script>

<template>
  <PropertySectionUi v-if="node" title="Link" icon="settings" :default-open="false">
    <div class="space-y-1.5">
      <FieldRowUi label="Link to" label-width="sm">
        <SelectUi :model-value="linkType" :options="typeOptions" @update:model-value="linkType = $event as 'url' | 'page' | 'post'" />
      </FieldRowUi>

      <FieldRowUi v-if="linkType === 'url'" label="URL" label-width="sm">
        <InputUi
          :model-value="node.link?.url ?? ''"
          placeholder="https://..."
          @update:model-value="updateLink({ url: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi v-else-if="linkType === 'page'" label="Page" label-width="sm">
        <SelectUi
          :model-value="node.link?.url ?? ''"
          :options="pageOptions"
          @update:model-value="updateLink({ url: $event || undefined })"
        />
      </FieldRowUi>
      <FieldRowUi v-else label="Post" label-width="sm">
        <SelectUi
          :model-value="node.link?.url ?? ''"
          :options="postOptions"
          @update:model-value="updateLink({ url: $event || undefined })"
        />
      </FieldRowUi>

      <FieldRowUi label="Target" label-width="sm">
        <SelectUi
          :model-value="node.link?.target ?? '_self'"
          :options="targetOptions"
          @update:model-value="updateLink({ target: $event as '_self' | '_blank' })"
        />
      </FieldRowUi>
      <FieldRowUi label="Rel" label-width="sm">
        <InputUi
          :model-value="node.link?.rel ?? ''"
          placeholder="nofollow noopener"
          @update:model-value="updateLink({ rel: $event || undefined })"
        />
      </FieldRowUi>
    </div>
  </PropertySectionUi>
</template>
