<script setup lang="ts">
import { computed } from 'vue'
import { sales, formatCurrency } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const up = computed(() => sales.changePct >= 0)
</script>

<template>
  <CardUi icon="sales" title="Recent sales">
    <template #header-action>
      <BadgeUi :variant="up ? 'success' : 'error'" size="xs">
        {{ up ? '+' : '' }}{{ sales.changePct }}%
      </BadgeUi>
    </template>

    <div class="flex flex-col gap-3">
      <div class="flex items-baseline gap-2">
        <span class="text-xl font-semibold text-foreground">{{ formatCurrency(sales.total) }}</span>
        <span class="text-[10px] text-secondary">this week</span>
      </div>

      <div class="flex flex-col gap-1">
        <div
          v-for="sale in sales.recent"
          :key="sale.id"
          class="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium text-foreground">{{ sale.customer }}</p>
            <p class="truncate text-[10px] text-secondary">{{ sale.product }}</p>
          </div>
          <span class="shrink-0 text-xs font-medium text-green-fg">{{ formatCurrency(sale.amount) }}</span>
        </div>
      </div>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1">
        Manage sales
        <IconUi name="arrow-right" size="size-3" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
