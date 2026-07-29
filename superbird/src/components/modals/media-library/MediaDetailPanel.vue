<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import { useCanvasStore } from '@/stores/canvas'
import { useToast } from '@/composables/useToast'
import { formatFileSize } from '@/lib/media'
import { formatDate } from '@/lib/datetime'
import type { CanvasNode, MediaItem } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  item: MediaItem
}>()

const emit = defineEmits<{
  deleted: []
}>()

const store = useMediaStore()
const canvas = useCanvasStore()
const toast = useToast()

const folderOptions = computed(() => [
  { value: '', label: 'Uncategorized' },
  ...store.mediaFolders.map((f) => ({ value: f.id, label: f.name })),
])

const fmtDate = (iso: string) => formatDate(iso, '—')

const usage = computed(() => {
  const out: { pageId: string; pageName: string; count: number }[] = []
  const visit = (node: CanvasNode, tally: { n: number }) => {
    if (node.content === props.item.id) tally.n++
    for (const child of node.children ?? []) visit(child, tally)
  }
  for (const page of canvas.pages) {
    if (!page.body) continue
    const tally = { n: 0 }
    visit(page.body, tally)
    if (tally.n) out.push({ pageId: page.id, pageName: page.name, count: tally.n })
  }
  return out
})

function detach(pageId: string, pageName: string) {
  const n = canvas.detachMediaOnPage(pageId, props.item.id)
  if (n) toast.success(`Removed from ${pageName}`)
}

const pendingDelete = ref<MediaItem | null>(null)
function deleteItem() {
  pendingDelete.value = props.item
}
function doDelete() {
  const target = pendingDelete.value
  if (!target) return
  store.removeMediaItem(target.id)
  emit('deleted')
  pendingDelete.value = null
}
</script>

<template>
  <div class="w-56 shrink-0 border-l flex flex-col">
    <div class="p-3 border-b">
      <span class="text-xs font-semibold">Details</span>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <div class="aspect-square rounded-lg bg-secondary/5 flex items-center justify-center overflow-hidden">
        <img v-if="item.type === 'image' && item.url" :src="item.url" class="w-full h-full object-contain" />
        <span v-else class="text-xs text-secondary font-mono">{{ item.mimeType }}</span>
      </div>

      <div class="space-y-1.5">
        <div class="space-y-0.5">
          <LabelUi size="xs">Name</LabelUi>
          <InputUi
            size="xs"
            :model-value="item.name"
            @update:model-value="store.updateMediaItem(item.id, { name: $event })"
          />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Alt Text</LabelUi>
          <InputUi
            size="xs"
            :model-value="item.alt ?? ''"
            placeholder="Describe the image"
            @update:model-value="store.updateMediaItem(item.id, { alt: $event || undefined })"
          />
        </div>
        <div class="space-y-0.5">
          <LabelUi size="xs">Folder</LabelUi>
          <DropdownUi
            class="w-full"
            :model-value="item.folderId ?? ''"
            :options="folderOptions"
            @update:model-value="store.moveMediaToFolder(item.id, $event || undefined)"
          />
        </div>
        <div class="space-y-1 pt-1 text-[10px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-secondary">Weight</span>
            <span class="font-medium">{{ formatFileSize(item.size) }}</span>
          </div>
          <div v-if="item.width" class="flex items-center justify-between gap-2">
            <span class="text-secondary">Dimensions</span>
            <span class="font-medium">{{ item.width }} × {{ item.height }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-secondary">Uploaded</span>
            <span class="font-medium">{{ fmtDate(item.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-1">
        <LabelUi size="xs">Used on</LabelUi>
        <div v-if="usage.length" class="space-y-0.5">
          <div
            v-for="u in usage"
            :key="u.pageId"
            class="group flex items-center gap-2 text-[10px]"
          >
            <span class="min-w-0 flex-1 truncate">{{ u.pageName }}</span>
            <span class="shrink-0 text-secondary">{{ u.count }}×</span>
            <IconButtonUi
              size="xs"
              variant="danger"
              title="Detach from this page"
              class="opacity-0 group-hover:opacity-100"
              @click="detach(u.pageId, u.pageName)"
            >
              <IconUi name="close" size="size-3" />
            </IconButtonUi>
          </div>
        </div>
        <p v-else class="text-[10px] text-secondary">Not used on any page yet.</p>
      </div>

      <div class="rounded-lg bg-secondary/5 p-2.5 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <IconUi name="lock" size="size-3.5" class="text-secondary" />
            <span class="text-[11px] font-medium">Private</span>
          </div>
          <ToggleUi
            :model-value="item.private ?? false"
            @update:model-value="store.updateMediaItem(item.id, { private: $event })"
          />
        </div>
        <p class="text-[10px] leading-relaxed text-secondary">
          Hidden from the published site and non-logged-in visitors.
        </p>
      </div>
    </div>

    <div class="p-3 border-t">
      <ButtonUi variant="danger" size="sm" class="w-full text-[10px]" @click="deleteItem">
        Delete
      </ButtonUi>
    </div>

    <ConfirmDialogUi
      :open="!!pendingDelete"
      title="Delete media"
      :description="pendingDelete ? `Delete “${pendingDelete.name}”? Any element using it will lose its image. This can’t be undone.` : ''"
      confirm-label="Delete"
      @update:open="pendingDelete = null"
      @confirm="doDelete"
    />
  </div>
</template>
