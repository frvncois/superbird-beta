<script setup lang="ts">
import { computed } from 'vue'
import { analytics } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const max = computed(() => Math.max(...analytics.series.map((p) => p.value)))
const up = computed(() => analytics.changePct >= 0)
</script>

<template>
  <CardUi icon="analytics" title="Analytics" icon-class="bg-blue-bg text-blue-fg">
    <div class="mb-4 flex items-end gap-2">
      <span class="text-2xl font-semibold text-foreground">{{ analytics.visitors.toLocaleString() }}</span>
      <span class="text-xs text-secondary">visitors this week</span>
      <span
        :class="[
          'ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium',
          up ? 'bg-green-bg text-green-fg' : 'bg-red-bg text-red-fg',
        ]"
      >
        <IconUi :name="up ? 'trend-up' : 'trend-down'" size="size-3.5" />
        {{ up ? '+' : '' }}{{ analytics.changePct }}%
      </span>
    </div>

    <!-- Mini bar chart -->
    <div class="flex h-28 items-end gap-2">
      <div
        v-for="p in analytics.series"
        :key="p.label"
        class="group flex flex-1 flex-col items-center gap-1.5"
      >
        <div class="flex w-full flex-1 items-end">
          <div
            class="w-full rounded-t-md bg-primary/80 transition-colors duration-150 group-hover:bg-primary"
            :style="{ height: `${Math.round((p.value / max) * 100)}%` }"
            :title="`${p.label}: ${p.value.toLocaleString()}`"
          />
        </div>
        <span class="text-[10px] font-mono text-secondary/60">{{ p.label }}</span>
      </div>
    </div>

    <template #actions>
      <ButtonUi variant="ghost" size="sm" class="ml-auto">
        View more
        <IconUi name="arrow-right" size="size-3.5" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
