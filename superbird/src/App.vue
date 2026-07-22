<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import MediaLibraryModal from '@/components/modals/media-library/MediaLibraryModal.vue'
import AssistantWidget from '@/components/assistant/AssistantWidget.vue'

const auth = useAuthStore()
</script>

<template>
  <RouterView />
  <!-- Global: reachable from the app menu in every mode -->
  <MediaLibraryModal />
  <!-- Floating AI assistant (signed-in only) -->
  <AssistantWidget v-if="auth.isAuthenticated" />
</template>
