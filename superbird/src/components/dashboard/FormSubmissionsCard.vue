<script setup lang="ts">
import { submissions } from '@/data/dashboardDemo'
import CardUi from '@/components/ui/CardUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <CardUi icon="submissions" title="Form submissions" icon-class="bg-purple-bg text-purple-fg">
    <ul class="space-y-1">
      <li
        v-for="s in submissions"
        :key="s.id"
        class="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-100 hover:bg-secondary/8"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-[10px] font-mono font-medium text-secondary">
          {{ initials(s.name) }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-foreground">{{ s.name }}</div>
          <div class="truncate text-xs text-secondary">{{ s.email }}</div>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-1">
          <span class="rounded bg-muted-bg px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-fg">{{ s.form }}</span>
          <span class="text-[10px] text-secondary/60">{{ s.time }}</span>
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
