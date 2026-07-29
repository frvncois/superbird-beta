<script setup lang="ts">
import { computed, provide } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import MediaLibraryModal from '@/components/modals/media-library/MediaLibraryModal.vue'
import OverlayHostUi from '@/components/ui/OverlayHostUi.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))
</script>

<template>
  <RouterView />
  <MediaLibraryModal />
  <OverlayHostUi />
  <ToastHost />
</template>
