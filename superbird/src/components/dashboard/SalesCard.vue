<script setup lang="ts">
import { computed } from 'vue'
import { sales, formatCurrency } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const up = computed(() => sales.changePct >= 0)
</script>

<template>
  <CardUi icon="sales" title="Recent sales" icon-class="bg-green-bg text-green-fg">
    <div class="mb-3 flex items-end gap-2">
      <span class="text-2xl font-semibold text-foreground">{{ formatCurrency(sales.total) }}</span>
      <span class="text-xs text-secondary">this week</span>
      <span
        :class="[
          'ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
          up ? 'bg-green-bg text-green-fg' : 'bg-red-bg text-red-fg',
        ]"
      >
        <IconUi :name="up ? 'trend-up' : 'trend-down'" size="size-3.5" />
        {{ up ? '+' : '' }}{{ sales.changePct }}%
      </span>
    </div>

    <ul class="space-y-1">
      <li
        v-for="sale in sales.recent"
        :key="sale.id"
        class="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-100 hover:bg-secondary/8"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-foreground">{{ sale.customer }}</div>
          <div class="truncate text-xs text-secondary">{{ sale.product }}</div>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-0.5">
          <span class="text-sm font-medium text-green-fg">{{ formatCurrency(sale.amount) }}</span>
          <span class="text-[10px] text-secondary/60">{{ sale.time }}</span>
        </div>
      </li>
    </ul>

    <template #actions>
      <ButtonUi variant="ghost" size="sm" class="ml-auto">
        View more
        <IconUi name="arrow-right" size="size-3.5" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
