<script setup lang="ts">
import AppHeader from '@/components/header/AppHeader.vue'

// The single app chrome: a self-contained AppHeader on top of a full-height body
// region. Views drop their body layout (DashboardLayout / EditorLayout /
// SettingsLayout) into the default slot. AppHeader configures itself from the
// route, so there is nothing to wire here.
</script>

<template>
  <div class="flex h-dvh w-screen flex-col overflow-hidden bg-background">
    <AppHeader />
    <div class="relative flex min-h-0 flex-1">
      <slot />
    </div>
  </div>
</template>
