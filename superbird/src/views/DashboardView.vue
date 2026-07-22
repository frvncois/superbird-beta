<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import FormSubmissionsCard from '@/components/dashboard/FormSubmissionsCard.vue'
import SalesCard from '@/components/dashboard/SalesCard.vue'

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
      <div class="h-full overflow-y-auto p-6">
        <div class="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
          <ProjectInfoCard class="lg:col-span-2" />
          <AnalyticsCard class="lg:col-span-2" />
          <FormSubmissionsCard />
          <SalesCard />
        </div>
      </div>
    </template>
  </DashboardLayout>
</template>
