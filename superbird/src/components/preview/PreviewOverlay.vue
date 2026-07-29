<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useMediaStore } from '@/stores/media'
import { useLocalesStore } from '@/stores/locales'
import { renderDocument, buildRenderContext, type RenderContext } from '@/lib/render'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const canvas = useCanvasStore()
const styles = useGlobalStylesStore()
const collections = useCollectionsStore()
const media = useMediaStore()
const locales = useLocalesStore()

const widths = [
  { key: 'desktop', label: 'Desktop', icon: 'desktop', width: 0 },
  { key: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', icon: 'mobile', width: 375 },
] as const
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const frameWidth = computed(() => widths.find((w) => w.key === viewport.value)?.width ?? 0)

const viewportOptions = widths.map((w) => ({ value: w.key, title: w.label }))
const viewportProxy = computed({
  get: () => viewport.value as string,
  set: (v) => (viewport.value = v as 'desktop' | 'tablet' | 'mobile'),
})

const ctx = computed<RenderContext>(() =>
  buildRenderContext({
    entries: collections.entries,
    collections: collections.collections,
    mediaUrl: (id) => media.mediaItems.find((m) => m.id === id)?.url ?? '',
    activeEntry: canvas.activeEntry ?? undefined,
    locale: {
      locale: locales.activeLocale,
      defaultLocale: locales.defaultLocale,
      locales: locales.locales.map((l) => ({ code: l.code, label: l.label })),
    },
    includeDrafts: true,
  }),
)

const srcdoc = computed(() =>
  renderDocument(canvas.activePage.body, styles.styleClasses, styles.globalStyles, ctx.value),
)
</script>

<template>
  <div class="fixed inset-0 z-[90] flex flex-col bg-background">
    <div class="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <div class="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <IconUi name="eye" size="size-4" class="text-secondary" />
        Preview
        <span class="text-secondary">·</span>
        <span class="text-secondary">{{ canvas.activePage.name }}</span>
      </div>

      <SegmentedControlUi v-model="viewportProxy" :options="viewportOptions" class="mx-auto">
        <template #option="{ option }">
          <IconUi :name="option.value" size="size-3.5" />
        </template>
      </SegmentedControlUi>

      <ButtonUi variant="outline" size="sm" icon="close" @click="canvas.closePreview()">
        Close
      </ButtonUi>
    </div>

    <div class="flex-1 overflow-auto bg-secondary/5 p-4">
      <iframe
        :srcdoc="srcdoc"
        title="Page preview"
        sandbox="allow-scripts"
        class="mx-auto block h-full border bg-white shadow-sm transition-[width] duration-200"
        :style="{ width: frameWidth ? `${frameWidth}px` : '100%' }"
      />
    </div>
  </div>
</template>
