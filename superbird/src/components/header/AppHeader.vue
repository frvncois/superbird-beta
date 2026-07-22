<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import HeaderMenu from './HeaderMenu.vue'
import HeaderContextBar from './HeaderContextBar.vue'

defineProps<{
  mode: 'dashboard' | 'editor' | 'settings'
}>()

const router = useRouter()
const mediaStore = useMediaStore()
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
      <!-- Media Library -->
      <ButtonUi variant="ghost" size="sm" @click="mediaStore.openLibrary()">
        <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 9.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.305l-3.47-3.47a.75.75 0 0 0-1.06 0l-3.72 3.72-2.22-2.22a.75.75 0 0 0-1.06 0L2.5 12.94v1.81Zm0-4.94 2.22-2.22a2.25 2.25 0 0 1 3.182 0l.97.97 3.47-3.47a2.25 2.25 0 0 1 3.182 0L17.5 7.06V5.25a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v4.56Z" clip-rule="evenodd" />
        </svg>
        Media Library
      </ButtonUi>
      <div class="h-4 w-px bg-border" />
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
