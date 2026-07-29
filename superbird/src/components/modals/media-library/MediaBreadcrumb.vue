<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import IconUi from '@/components/ui/IconUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

const props = defineProps<{
  currentFolder?: string
}>()

const emit = defineEmits<{
  navigate: [folderId: string | undefined]
}>()

const store = useMediaStore()

const MEDIA_DND = 'application/superbird-media'
const dropTarget = ref<string | null>(null)

function onCrumbDragOver(e: DragEvent, key: string) {
  if (!e.dataTransfer?.types.includes(MEDIA_DND)) return
  e.preventDefault()
  dropTarget.value = key
}

function onCrumbDrop(e: DragEvent, folderId: string | undefined) {
  dropTarget.value = null
  if (!e.dataTransfer?.types.includes(MEDIA_DND)) return
  e.preventDefault()
  const id = e.dataTransfer.getData(MEDIA_DND)
  if (id) store.moveMediaToFolder(id, folderId)
}

const trail = computed(() => {
  const path: { id: string; name: string }[] = []
  let id = props.currentFolder
  const seen = new Set<string>()
  while (id && !seen.has(id)) {
    seen.add(id)
    const folder = store.mediaFolders.find((f) => f.id === id)
    if (!folder) break
    path.unshift({ id: folder.id, name: folder.name })
    id = folder.parentId
  }
  return path
})
</script>

<template>
  <nav class="flex items-center gap-1 overflow-x-auto px-4 py-2 text-xs text-secondary">
    <ButtonUi
      variant="ghost"
      size="sm"
      :class="[
        'shrink-0',
        dropTarget === 'root' ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : '',
        !currentFolder ? 'font-medium text-foreground' : '',
      ]"
      @click="emit('navigate', undefined)"
      @dragover="(e: DragEvent) => onCrumbDragOver(e, 'root')"
      @dragleave="dropTarget = null"
      @drop="(e: DragEvent) => onCrumbDrop(e, undefined)"
    >
      Media
    </ButtonUi>
    <template v-for="(crumb, i) in trail" :key="crumb.id">
      <IconUi name="chevron-right" size="size-3" class="shrink-0 text-secondary/50" />
      <ButtonUi
        variant="ghost"
        size="sm"
        :class="[
          'shrink-0 truncate',
          dropTarget === crumb.id ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : '',
          i === trail.length - 1 ? 'font-medium text-foreground' : '',
        ]"
        @click="emit('navigate', crumb.id)"
        @dragover="(e: DragEvent) => onCrumbDragOver(e, crumb.id)"
        @dragleave="dropTarget = null"
        @drop="(e: DragEvent) => onCrumbDrop(e, crumb.id)"
      >
        {{ crumb.name }}
      </ButtonUi>
    </template>
  </nav>
</template>
