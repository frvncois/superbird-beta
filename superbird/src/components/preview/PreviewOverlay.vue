<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useCollectionsStore } from '@/stores/collections'
import { useMediaStore } from '@/stores/media'
import { useLocalesStore } from '@/stores/locales'
import { renderDocument, buildRenderContext, type RenderContext } from '@/lib/render'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const canvas = useCanvasStore()
const styles = useGlobalStylesStore()
const collections = useCollectionsStore()
const media = useMediaStore()
const locales = useLocalesStore()

// Viewport widths to exercise the compiled @media rules.
const widths = [
  { key: 'desktop', label: 'Desktop', icon: 'desktop', width: 0 },
  { key: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', icon: 'mobile', width: 375 },
] as const
const viewport = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const frameWidth = computed(() => widths.find((w) => w.key === viewport.value)?.width ?? 0)

// Same render context factory as the SSR site, backed by the editor stores.
// includeDrafts:true — Preview shows unpublished entries as an authoring aid
// (the published site does not). Recomputed so entry/locale switches re-render.
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
    <!-- Toolbar -->
    <div class="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <div class="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <IconUi name="eye" size="size-4" class="text-secondary" />
        Preview
        <span class="text-secondary">·</span>
        <span class="text-secondary">{{ canvas.activePage.name }}</span>
      </div>

      <div class="mx-auto flex items-center gap-0.5 rounded-xl bg-foreground/5 p-0.5">
        <button
          v-for="w in widths"
          :key="w.key"
          type="button"
          :class="[
            'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs cursor-pointer transition-colors duration-100',
            viewport === w.key ? 'bg-background text-foreground shadow-sm' : 'text-secondary hover:text-foreground',
          ]"
          @click="viewport = w.key"
        >
          <IconUi :name="w.icon" size="size-3.5" />
        </button>
      </div>

      <ButtonUi variant="outline" size="sm" icon="close" @click="canvas.closePreview()">
        Close
      </ButtonUi>
    </div>

    <!-- Rendered page (isolated in an iframe so editor styles can't leak in) -->
    <div class="flex-1 overflow-auto bg-secondary/5 p-4">
      <iframe
        :srcdoc="srcdoc"
        title="Page preview"
        class="mx-auto block h-full border bg-white shadow-sm transition-[width] duration-200"
        :style="{ width: frameWidth ? `${frameWidth}px` : '100%' }"
      />
    </div>
  </div>
</template>
