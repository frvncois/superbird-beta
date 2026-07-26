<script setup lang="ts">
import { ref } from 'vue'
import AppShell from '@/layouts/AppShell.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import SitePreview from '@/components/canvas/SitePreview.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import FormSubmissionsCard from '@/components/dashboard/FormSubmissionsCard.vue'
import DashboardDetailPanel from '@/components/dashboard/DashboardDetailPanel.vue'
import SubmissionsSection from '@/components/settings/SubmissionsSection.vue'
import AnalyticsDetail from '@/components/dashboard/AnalyticsDetail.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

type Detail = 'submissions' | 'analytics'
const detail = ref<Detail | null>(null)
function open(d: Detail) { detail.value = d }
function back() { detail.value = null }
</script>

<template>
  <AppShell>
    <DashboardLayout :wide="detail !== null">
      <template #sidebar>
      <!-- Card stack -->
      <div v-if="!detail" class="flex h-full flex-col gap-3.5">
        <ProjectInfoCard />
        <AnalyticsCard style="animation-delay: 60ms" @view="open('analytics')" />
        <FormSubmissionsCard style="animation-delay: 120ms" @view="open('submissions')" />
      </div>

      <!-- Detail -->
      <DashboardDetailPanel v-else-if="detail === 'submissions'" icon="submissions" title="Form submissions" @back="back">
        <template #action>
          <ButtonUi variant="outline" size="sm" to="/settings?tab=forms"><IconUi name="settings" size="size-3.5" /> Form settings</ButtonUi>
        </template>
        <SubmissionsSection embedded />
      </DashboardDetailPanel>

      <DashboardDetailPanel v-else-if="detail === 'analytics'" icon="analytics" title="Analytics" @back="back">
        <AnalyticsDetail />
      </DashboardDetailPanel>
    </template>

      <template #canvas>
        <SitePreview />
      </template>
    </DashboardLayout>
  </AppShell>
</template>
