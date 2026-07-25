<script setup lang="ts">
import { computed, provide } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import MediaLibraryModal from '@/components/modals/media-library/MediaLibraryModal.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

// Design tokens for UI primitives (ColorInputUi / UnitInputUi swatches),
// provided once at the app root for every view that needs them.
const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))
</script>

<template>
  <RouterView />
  <MediaLibraryModal />
  <ToastHost />
</template>
