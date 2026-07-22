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
      <IconUi name="search" size="size-3.5" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
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
      <IconUi name="upload" size="size-3.5" />
      Upload
    </ButtonUi>
    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileInput" />

    <!-- Close -->
    <IconButtonUi title="Close" class="shrink-0" @click="emit('close')">
      <IconUi name="close" size="size-4" />
    </IconButtonUi>
  </div>
</template>
