<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import SitePreview from '@/components/canvas/SitePreview.vue'

// Dashboard data comes later; the sidebar is a placeholder for now.
</script>

<template>
  <DashboardLayout>
    <template #header>
      <AppHeader mode="dashboard" />
    </template>

    <template #sidebar>
      <div class="p-4 text-xs text-secondary/60">Dashboard</div>
    </template>

    <template #canvas>
      <SitePreview />
    </template>
  </DashboardLayout>
</template>
