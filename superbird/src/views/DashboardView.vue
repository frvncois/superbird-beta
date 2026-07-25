<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/lib/api'
import AppShell from '@/layouts/AppShell.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import SitePreview from '@/components/canvas/SitePreview.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import AnalyticsCard from '@/components/dashboard/AnalyticsCard.vue'
import FormSubmissionsCard from '@/components/dashboard/FormSubmissionsCard.vue'
import SalesCard from '@/components/dashboard/SalesCard.vue'
import StoreFeatureCard from '@/components/dashboard/StoreFeatureCard.vue'
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

// Only show the sales card once we know the store is on; otherwise a promo card.
const storeEnabled = ref<boolean | null>(null)
onMounted(async () => {
  try {
    const c = await apiGet<{ enabled: boolean }>('/api/store/config')
    storeEnabled.value = c.enabled
  } catch {
    storeEnabled.value = false
  }
})
</script>

<template>
  <AppShell>
    <DashboardLayout :wide="detail !== null">
      <template #sidebar>
      <!-- Card stack -->
      <div v-if="!detail" class="flex h-full flex-col gap-3.5 px-3.5 pb-3.5">
        <ProjectInfoCard />
        <AnalyticsCard style="animation-delay: 60ms" @view="open('analytics')" />
        <FormSubmissionsCard style="animation-delay: 120ms" @view="open('submissions')" />
        <SalesCard v-if="storeEnabled === true" style="animation-delay: 180ms" @view="open('sales')" />
        <StoreFeatureCard v-else-if="storeEnabled === false" style="animation-delay: 180ms" />
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
  </AppShell>
</template>
