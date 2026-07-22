<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvas'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import HeaderMenu from './HeaderMenu.vue'
import HeaderContextBar from './HeaderContextBar.vue'

defineProps<{
  mode: 'dashboard' | 'editor' | 'settings'
}>()

const router = useRouter()
const canvasStore = useCanvasStore()

const editorModeOptions = [
  { value: 'design', label: 'Design' },
  { value: 'content', label: 'Content' },
]
</script>

<template>
  <!-- Left: logo + app menu (all modes) -->
  <div class="flex items-center gap-4">
    <div class="size-6 text-foreground">
      <SuperbirdIcon />
    </div>
    <div class="h-4 w-px bg-border" />
    <HeaderMenu :mode="mode" />
  </div>

  <!-- Center: context bar (editor only) -->
  <div class="flex items-center gap-1.5">
    <HeaderContextBar v-if="mode === 'editor'" />
  </div>

  <!-- Right: actions -->
  <div class="flex items-center gap-2">
    <template v-if="mode === 'editor'">
      <!-- Design / Content mode -->
      <SegmentedControlUi
        :model-value="canvasStore.editorMode"
        :options="editorModeOptions"
        @update:model-value="canvasStore.setEditorMode($event as 'design' | 'content')"
      />
      <ButtonUi variant="outline" size="sm" @click="canvasStore.openPreview()">
        <IconUi name="eye" size="size-4" />
        Preview
      </ButtonUi>
      <div class="h-4 w-px bg-border mx-2" />
      <ButtonUi variant="outline" size="sm" @click="router.push('/')">Close</ButtonUi>
      <ButtonUi variant="solid" size="sm">Save</ButtonUi>
    </template>

    <template v-else-if="mode === 'settings'">
      <ButtonUi variant="outline" size="sm" @click="router.back()">Done</ButtonUi>
    </template>

    <template v-else>
      <!-- Dashboard: site status (placeholder — wired to data later) -->
      <span class="flex items-center gap-1.5 rounded-lg bg-secondary/5 px-2.5 py-1 text-[11px] text-secondary">
        <span class="size-1.5 rounded-full bg-green-fg" /> Published
      </span>
      <ButtonUi variant="solid" size="sm" @click="router.push('/editor')">Open editor</ButtonUi>
    </template>
  </div>
</template>
