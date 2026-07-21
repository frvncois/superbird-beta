<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaStore } from '@/stores/media'
import type { MediaType } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  activeFolder?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useMediaStore()

const search = defineModel<string>('search', { required: true })
const filterType = defineModel<MediaType | 'all'>('filterType', { required: true })

// SegmentedControlUi models a plain string; bridge it to the MediaType union.
const filterTypeProxy = computed<string>({
  get: () => filterType.value,
  set: (v) => {
    filterType.value = v as MediaType | 'all'
  },
})

const typeFilterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Docs' },
  { value: 'audio', label: 'Audio' },
]

const fileInput = ref<HTMLInputElement | null>(null)

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (const file of input.files) {
    const item = store.addMediaItem(file)
    if (props.activeFolder) store.moveMediaToFolder(item.id, props.activeFolder)
  }
  input.value = ''
}
</script>

<template>
  <div class="flex items-center gap-2 border-b px-4 py-2.5 shrink-0">
    <!-- Search -->
    <div class="relative flex-1 min-w-0">
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-secondary pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
      </svg>
      <InputUi v-model="search" placeholder="Search files..." class="pl-8" />
    </div>

    <!-- Type filters -->
    <SegmentedControlUi
      v-model="filterTypeProxy"
      :options="typeFilterOptions"
      class="shrink-0 text-[10px] font-medium"
    />

    <!-- Upload button -->
    <ButtonUi size="sm" class="shrink-0 text-[10px]" @click="fileInput?.click()">
      <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
      </svg>
      Upload
    </ButtonUi>
    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileInput" />

    <!-- Close -->
    <IconButtonUi title="Close" class="shrink-0" @click="emit('close')">
      <IconUi name="close" size="size-4" />
    </IconButtonUi>
  </div>
</template>
