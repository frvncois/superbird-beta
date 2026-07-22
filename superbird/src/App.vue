<script setup lang="ts">
import MediaLibraryModal from '@/components/modals/media-library/MediaLibraryModal.vue'
</script>

<template>
  <RouterView />
  <!-- Global: reachable from the app menu in every mode -->
  <MediaLibraryModal />
</template>
