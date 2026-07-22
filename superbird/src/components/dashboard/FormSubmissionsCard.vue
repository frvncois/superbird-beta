<script setup lang="ts">
import { submissions } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
</script>

<template>
  <CardUi icon="submissions" title="Form submissions">
    <template #header-action>
      <BadgeUi v-if="submissions.length > 0" variant="info" size="xs" dot>{{ submissions.length }} new</BadgeUi>
    </template>

    <div class="flex flex-col gap-1">
      <div
        v-for="s in submissions"
        :key="s.id"
        class="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-foreground">{{ s.name }}</p>
          <p class="truncate text-[10px] text-secondary">{{ s.email }}</p>
        </div>
        <span class="shrink-0 rounded-md bg-muted-bg px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-fg">{{ s.form }}</span>
        <span class="shrink-0 text-[10px] text-secondary/60">{{ s.time }}</span>
      </div>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1">
        View all
        <IconUi name="arrow-right" size="size-3" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
