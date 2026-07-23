<script setup lang="ts">
import MediaLibraryModal from '@/components/modals/media-library/MediaLibraryModal.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
</script>

<template>
  <RouterView />
  <!-- Global: reachable from the app menu in every mode -->
  <MediaLibraryModal />
  <!-- Global overlays: confirm/prompt/process dialogs + toast notifications -->
  <ConfirmDialogUi />
  <ToastHost />
</template>
