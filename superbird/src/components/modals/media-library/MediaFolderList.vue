<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const store = useMediaStore()

const activeFolder = defineModel<string | undefined>('activeFolder')

const showNewFolder = ref(false)
const newFolderName = ref('')

const rootFolders = computed(() => store.mediaFolders.filter((f) => !f.parentId))

function createFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  store.addMediaFolder(name, activeFolder.value)
  newFolderName.value = ''
  showNewFolder.value = false
}

function deleteFolder(id: string) {
  if (activeFolder.value === id) activeFolder.value = undefined
  store.removeMediaFolder(id)
}
</script>

<template>
  <div class="w-48 shrink-0 border-r flex flex-col">
    <div class="p-3 border-b">
      <span class="text-xs font-semibold">Media Library</span>
    </div>

    <!-- Folders -->
    <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <button
        :class="[
          'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors duration-100',
          !activeFolder ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground/80 hover:bg-secondary/8',
        ]"
        @click="activeFolder = undefined"
      >
        <svg class="size-3.5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
        </svg>
        All Files
      </button>
      <div
        v-for="folder in rootFolders"
        :key="folder.id"
        :class="[
          'group flex w-full items-center gap-2 rounded-lg pl-2.5 pr-1 py-1 text-xs cursor-pointer transition-colors duration-100',
          activeFolder === folder.id ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground/80 hover:bg-secondary/8',
        ]"
        @click="activeFolder = folder.id"
        @contextmenu.prevent
      >
        <svg class="size-3.5 shrink-0 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
        </svg>
        <span class="flex-1 truncate text-left">{{ folder.name }}</span>
        <IconButtonUi
          size="sm"
          variant="danger"
          title="Delete folder"
          class="opacity-0 group-hover:opacity-100"
          @click.stop="deleteFolder(folder.id)"
        >
          <IconUi name="delete" size="size-3" />
        </IconButtonUi>
      </div>
    </div>

    <!-- New folder -->
    <div class="p-2 border-t">
      <div v-if="showNewFolder" class="flex items-center gap-1">
        <InputUi
          v-model="newFolderName"
          size="xs"
          placeholder="Folder name"
          class="flex-1"
          @keydown.enter="createFolder"
          @keydown.escape="showNewFolder = false"
        />
        <ButtonUi size="sm" class="shrink-0 px-2 text-[10px]" @click="createFolder">Add</ButtonUi>
      </div>
      <button
        v-else
        class="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary cursor-pointer hover:bg-secondary/8 hover:text-foreground transition-colors duration-100"
        @click="showNewFolder = true"
      >
        <IconUi name="plus" size="size-3" />
        New Folder
      </button>
    </div>
  </div>
</template>
