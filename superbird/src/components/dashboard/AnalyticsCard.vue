<script setup lang="ts">
import { analytics } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ChartUi from '@/components/ui/ChartUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
</script>

<template>
  <CardUi icon="analytics" title="Analytics">
    <div class="flex flex-col gap-3">
      <ChartUi :data="analytics.series" :height="80" />

      <div class="flex items-center justify-between">
        <p class="text-[10px] text-secondary">Visits this week</p>
        <p class="text-[10px] font-medium text-foreground">{{ analytics.visitors.toLocaleString() }}</p>
      </div>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1">
        View analytics
        <IconUi name="arrow-right" size="size-3" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
