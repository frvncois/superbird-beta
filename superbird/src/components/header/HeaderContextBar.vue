<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import IconUi from '@/components/ui/IconUi.vue'
import HeaderPageDropdown from './HeaderPageDropdown.vue'
import HeaderPageSettings from './HeaderPageSettings.vue'
import HeaderViewportSwitch from './HeaderViewportSwitch.vue'
import HeaderLocaleSwitch from './HeaderLocaleSwitch.vue'

const store = useCanvasStore()

function backToTemplate() {
  if (store.activeCollection) store.openCollection(store.activeCollection.id)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Pages / collections navigation -->
    <HeaderPageDropdown />

    <!-- Page settings (status, title, slug, SEO) -->
    <HeaderPageSettings />

    <!-- Back to the collection template (only while editing an item) -->
    <button
      v-if="store.activeEntry"
      class="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-secondary cursor-pointer hover:bg-secondary/10 hover:text-foreground transition-colors duration-100"
      @click="backToTemplate"
    >
      <IconUi name="chevron-down" size="size-3" class="rotate-90" /> Template
    </button>

    <div class="h-4 w-px bg-border" />

    <!-- Viewport selector + translation (always) -->
    <HeaderViewportSwitch />
    <HeaderLocaleSwitch />
  </div>
</template>
