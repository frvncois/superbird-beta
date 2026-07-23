<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  currentFolder?: string
}>()

const emit = defineEmits<{
  navigate: [folderId: string | undefined]
}>()

const store = useMediaStore()

// Breadcrumb segments accept a dropped file → move it to that folder (root =
// undefined). This is how a file is dragged back out to a parent.
const MEDIA_DND = 'application/superbird-media'
// null = nothing, 'root' = the Media crumb, else a folder id.
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

// Root → current, walking up the parentId chain (cycle-guarded).
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
    <button
      :class="[
        'shrink-0 rounded-md px-1.5 py-0.5 cursor-pointer transition-colors duration-100',
        dropTarget === 'root' ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'hover:bg-secondary/10',
        !currentFolder ? 'font-medium text-foreground' : 'hover:text-foreground',
      ]"
      @click="emit('navigate', undefined)"
      @dragover="(e) => onCrumbDragOver(e, 'root')"
      @dragleave="dropTarget = null"
      @drop="(e) => onCrumbDrop(e, undefined)"
    >
      Media
    </button>
    <template v-for="(crumb, i) in trail" :key="crumb.id">
      <IconUi name="chevron-right" size="size-3" class="shrink-0 text-secondary/50" />
      <button
        :class="[
          'shrink-0 truncate rounded-md px-1.5 py-0.5 cursor-pointer transition-colors duration-100',
          dropTarget === crumb.id ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'hover:bg-secondary/10',
          i === trail.length - 1 ? 'font-medium text-foreground' : 'hover:text-foreground',
        ]"
        @click="emit('navigate', crumb.id)"
        @dragover="(e) => onCrumbDragOver(e, crumb.id)"
        @dragleave="dropTarget = null"
        @drop="(e) => onCrumbDrop(e, crumb.id)"
      >
        {{ crumb.name }}
      </button>
    </template>
  </nav>
</template>
