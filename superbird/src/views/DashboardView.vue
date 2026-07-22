<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import SitePreview from '@/components/canvas/SitePreview.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import FormSubmissionsCard from '@/components/dashboard/FormSubmissionsCard.vue'
import SalesCard from '@/components/dashboard/SalesCard.vue'
</script>

<template>
  <DashboardLayout>
    <template #header>
      <AppHeader mode="dashboard" />
    </template>

    <template #sidebar>
      <div class="flex flex-col gap-4 p-4">
        <ProjectInfoCard />
        <AnalyticsCard />
        <FormSubmissionsCard />
        <SalesCard />
      </div>
    </template>

    <template #canvas>
      <SitePreview />
    </template>
  </DashboardLayout>
</template>
