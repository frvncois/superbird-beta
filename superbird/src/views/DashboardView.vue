<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import SitePreview from '@/components/canvas/SitePreview.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import FormSubmissionsCard from '@/components/dashboard/FormSubmissionsCard.vue'
import SalesCard from '@/components/dashboard/SalesCard.vue'
import DashboardDetailPanel from '@/components/dashboard/DashboardDetailPanel.vue'
import SubmissionsSection from '@/components/settings/SubmissionsSection.vue'
import OrdersSection from '@/components/settings/OrdersSection.vue'
import AnalyticsDetail from '@/components/dashboard/AnalyticsDetail.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

type Detail = 'sales' | 'submissions' | 'analytics'
const detail = ref<Detail | null>(null)
function open(d: Detail) { detail.value = d }
function back() { detail.value = null }
</script>

<template>
  <DashboardLayout :wide="detail !== null">
    <template #header>
      <AppHeader mode="dashboard" />
    </template>

    <template #sidebar>
      <!-- Card stack -->
      <div v-if="!detail" class="flex flex-col gap-3 p-3">
        <ProjectInfoCard class="animate-fade-in-up" />
        <AnalyticsCard class="animate-fade-in-up" style="animation-delay: 60ms" @view="open('analytics')" />
        <FormSubmissionsCard class="animate-fade-in-up" style="animation-delay: 120ms" @view="open('submissions')" />
        <SalesCard class="animate-fade-in-up" style="animation-delay: 180ms" @view="open('sales')" />
      </div>

      <!-- Detail -->
      <DashboardDetailPanel v-else-if="detail === 'submissions'" icon="submissions" title="Form submissions" @back="back">
        <template #action>
          <ButtonUi variant="outline" size="sm" to="/settings?tab=forms"><IconUi name="settings" size="size-3.5" /> Form settings</ButtonUi>
        </template>
        <SubmissionsSection embedded />
      </DashboardDetailPanel>

      <DashboardDetailPanel v-else-if="detail === 'sales'" icon="sales" title="Recent sales" @back="back">
        <template #action>
          <ButtonUi variant="outline" size="sm" to="/settings?tab=store"><IconUi name="settings" size="size-3.5" /> Store settings</ButtonUi>
        </template>
        <OrdersSection />
      </DashboardDetailPanel>

      <DashboardDetailPanel v-else-if="detail === 'analytics'" icon="analytics" title="Analytics" @back="back">
        <AnalyticsDetail />
      </DashboardDetailPanel>
    </template>

    <template #canvas>
      <SitePreview />
    </template>
  </DashboardLayout>
</template>
