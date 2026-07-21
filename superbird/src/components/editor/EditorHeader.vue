<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import SuperbirdIcon from '@/components/icons/SuperbirdIcon.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import HeaderPageSelect from './HeaderPageSelect.vue'
import HeaderViewportSwitch from './HeaderViewportSwitch.vue'
import HeaderLocaleSwitch from './HeaderLocaleSwitch.vue'

const store = useCanvasStore()
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
    <!-- Left: Logo + page select -->
    <div class="flex items-center gap-4">
      <div class="size-6 text-foreground">
        <SuperbirdIcon />
      </div>
      <div class="h-4 w-px bg-border" />
      <HeaderPageSelect />
    </div>

    <!-- Center: viewport switcher -->
    <div class="flex items-center gap-1.5">
      <HeaderViewportSwitch />
      <slot name="toolbar" />
    </div>

    <!-- Right: actions -->
    <div class="flex items-center gap-2">
      <slot name="actions">
        <!-- Media Library -->
        <button
          class="flex size-7 items-center justify-center rounded-xl cursor-pointer text-secondary hover:bg-secondary/10 hover:text-foreground transition-colors duration-150"
          title="Media Library"
          @click="store.mediaLibraryOpen = true"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 9.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.305l-3.47-3.47a.75.75 0 0 0-1.06 0l-3.72 3.72-2.22-2.22a.75.75 0 0 0-1.06 0L2.5 12.94v1.81Zm0-4.94 2.22-2.22a2.25 2.25 0 0 1 3.182 0l.97.97 3.47-3.47a2.25 2.25 0 0 1 3.182 0L17.5 7.06V5.25a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v4.56Z" clip-rule="evenodd" />
          </svg>
        </button>
        <!-- Locale switcher -->
        <HeaderLocaleSwitch />
        <!-- Theme toggle -->
        <button
          class="flex size-7 items-center justify-center rounded-xl cursor-pointer text-secondary hover:bg-secondary/10 hover:text-foreground transition-colors duration-150"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <!-- Sun (light mode) -->
          <svg v-if="isDark" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 13.536a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM5.404 5.404a.75.75 0 0 0 0-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06a.75.75 0 0 0 1.06 0Z" />
          </svg>
          <!-- Moon (dark mode) -->
          <svg v-else class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clip-rule="evenodd" />
          </svg>
        </button>
        <!-- Global Styles -->
        <button
          class="flex size-7 items-center justify-center rounded-xl cursor-pointer text-secondary hover:bg-secondary/10 hover:text-foreground transition-colors duration-150"
          title="Global Styles"
          @click="store.globalStylesPanelOpen = true"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="h-4 w-px bg-border" />
        <ButtonUi variant="outline" size="sm">Close</ButtonUi>
        <ButtonUi variant="solid" size="sm">Save</ButtonUi>
      </slot>
    </div>
</template>
