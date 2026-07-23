<script setup lang="ts">
import { analytics, analyticsDetail } from '@/data/dashboardDemo'
import ChartUi from '@/components/ui/ChartUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const topMax = Math.max(...analyticsDetail.topPages.map((p) => p.views))
</script>

<template>
  <div class="space-y-5">
    <!-- Visitors + chart -->
    <div class="rounded-xl bg-muted-bg p-3">
      <div class="flex items-baseline justify-between">
        <div>
          <p class="text-[10px] text-secondary">Visitors this week</p>
          <p class="text-2xl font-semibold text-foreground">{{ analytics.visitors.toLocaleString() }}</p>
        </div>
        <span class="flex items-center gap-1 text-xs" :class="analytics.changePct >= 0 ? 'text-green-fg' : 'text-red-fg'">
          <IconUi :name="analytics.changePct >= 0 ? 'trend-up' : 'trend-down'" size="size-3" />
          {{ Math.abs(analytics.changePct) }}%
        </span>
      </div>
      <ChartUi :data="analytics.series" :height="120" class="mt-2" />
    </div>

    <!-- Stat grid -->
    <div class="grid grid-cols-2 gap-2">
      <div v-for="s in analyticsDetail.stats" :key="s.label" class="rounded-xl border border-border/70 p-3">
        <p class="text-[10px] text-secondary">{{ s.label }}</p>
        <div class="mt-0.5 flex items-baseline justify-between gap-2">
          <p class="text-sm font-semibold text-foreground">{{ s.value }}</p>
          <span class="text-[10px]" :class="s.change >= 0 ? 'text-green-fg' : 'text-red-fg'">{{ s.change >= 0 ? '+' : '' }}{{ s.change }}%</span>
        </div>
      </div>
    </div>

    <!-- Top pages -->
    <div>
      <p class="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">Top pages</p>
      <div class="space-y-2">
        <div v-for="p in analyticsDetail.topPages" :key="p.path" class="text-xs">
          <div class="flex justify-between gap-2">
            <span class="truncate text-foreground">{{ p.path }}</span>
            <span class="shrink-0 text-secondary">{{ p.views.toLocaleString() }}</span>
          </div>
          <div class="mt-1 h-1 overflow-hidden rounded-full bg-secondary/15">
            <div class="h-full rounded-full bg-foreground/70" :style="{ width: `${(p.views / topMax) * 100}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Traffic sources -->
    <div>
      <p class="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">Traffic sources</p>
      <div class="space-y-2">
        <div v-for="s in analyticsDetail.sources" :key="s.name" class="text-xs">
          <div class="flex justify-between gap-2"><span class="text-foreground">{{ s.name }}</span><span class="text-secondary">{{ s.pct }}%</span></div>
          <div class="mt-1 h-1 overflow-hidden rounded-full bg-secondary/15">
            <div class="h-full rounded-full bg-primary/70" :style="{ width: `${s.pct}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Devices -->
    <div>
      <p class="mb-2 font-mono text-[10px] uppercase tracking-wider text-secondary">Devices</p>
      <div class="space-y-2">
        <div v-for="d in analyticsDetail.devices" :key="d.name" class="text-xs">
          <div class="flex justify-between gap-2"><span class="text-foreground">{{ d.name }}</span><span class="text-secondary">{{ d.pct }}%</span></div>
          <div class="mt-1 h-1 overflow-hidden rounded-full bg-secondary/15">
            <div class="h-full rounded-full bg-foreground/50" :style="{ width: `${d.pct}%` }" />
          </div>
        </div>
      </div>
    </div>

    <p class="pt-1 text-center text-[10px] text-secondary/60">Demo data — analytics tracking isn't wired up yet.</p>
  </div>
</template>
