<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMediaStore } from '@/stores/media'
import { renderDocument, buildRenderContext, type RenderContext } from '@/lib/render'
import { timeAgo } from '@/lib/datetime'
import type { ProjectDocument, Snapshot } from '@shared/types'
import type { Collection, Entry, GlobalStyles, Locale, Page, StyleClass } from '@/types/canvas'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'

// Renders an arbitrary past document read-only — a pure renderDocument() call
// off the snapshot's JSON + the shared (read-only) media store. Touches no
// editing store, so the live canvas is unaffected.
const props = defineProps<{
  document: ProjectDocument
  meta: Snapshot | null
}>()
const emit = defineEmits<{ close: []; restore: [] }>()

const media = useMediaStore()

const pages = computed<Page[]>(() => (props.document.design?.pages as Page[] | undefined) ?? [])
const pageId = ref('')
watch(
  pages,
  (p) => {
    if (!p.find((x) => x.id === pageId.value)) pageId.value = p[0]?.id ?? ''
  },
  { immediate: true },
)
const currentPage = computed<Page | null>(() => pages.value.find((p) => p.id === pageId.value) ?? pages.value[0] ?? null)
const pageOptions = computed(() => pages.value.map((p) => ({ value: p.id, label: p.name })))

const widths = [
  { key: 'desktop', width: 0 },
  { key: 'tablet', width: 768 },
  { key: 'mobile', width: 375 },
] as const
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const frameWidth = computed(() => widths.find((w) => w.key === viewport.value)?.width ?? 0)
const viewportOptions = [
  { value: 'desktop', title: 'Desktop' },
  { value: 'tablet', title: 'Tablet' },
  { value: 'mobile', title: 'Mobile' },
]
const viewportProxy = computed({
  get: () => viewport.value as string,
  set: (v) => (viewport.value = v as 'desktop' | 'tablet' | 'mobile'),
})

const ctx = computed<RenderContext | null>(() => {
  const design = props.document.design
  if (!design) return null
  return buildRenderContext({
    entries: props.document.content.entries as Entry[],
    collections: props.document.content.collections as Collection[],
    mediaUrl: (id) => media.mediaItems.find((m) => m.id === id)?.url ?? '',
    locale: {
      locale: design.locales.activeLocale,
      defaultLocale: design.locales.defaultLocale,
      locales: (design.locales.locales as Locale[]).map((l) => ({ code: l.code, label: l.label })),
    },
    includeDrafts: true,
  })
})

const srcdoc = computed(() => {
  const design = props.document.design
  const page = currentPage.value
  if (!design || !page || !ctx.value) {
    return '<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:2rem;color:#666">This snapshot has no pages to preview.</body>'
  }
  return renderDocument(page.body, design.styleClasses as Record<string, StyleClass>, design.globalStyles as GlobalStyles, ctx.value)
})
</script>

<template>
  <div class="fixed inset-0 z-[90] flex flex-col bg-background">
    <!-- Toolbar -->
    <div class="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <div class="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
        <IconUi name="history" size="size-4" class="text-secondary" />
        Snapshot
        <BadgeUi v-if="meta" variant="neutral" size="xs" mono>{{ meta.label }}</BadgeUi>
        <span v-if="meta" class="truncate text-[11px] text-secondary">{{ timeAgo(meta.createdAt) }}</span>
      </div>

      <DropdownUi v-if="pageOptions.length > 1" v-model="pageId" :options="pageOptions" class="w-40" />

      <SegmentedControlUi v-model="viewportProxy" :options="viewportOptions" class="mx-auto">
        <template #option="{ option }">
          <IconUi :name="option.value" size="size-3.5" />
        </template>
      </SegmentedControlUi>

      <ButtonUi variant="solid" size="sm" icon="history" @click="emit('restore')">Restore this version</ButtonUi>
      <ButtonUi variant="outline" size="sm" icon="close" @click="emit('close')">Close</ButtonUi>
    </div>

    <!-- Rendered past page (isolated iframe) -->
    <div class="flex-1 overflow-auto bg-secondary/5 p-4">
      <iframe
        :srcdoc="srcdoc"
        title="Snapshot preview"
        class="mx-auto block h-full border bg-white shadow-sm transition-[width] duration-200"
        :style="{ width: frameWidth ? `${frameWidth}px` : '100%' }"
      />
    </div>
  </div>
</template>
