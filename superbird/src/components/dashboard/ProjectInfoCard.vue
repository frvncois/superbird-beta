<script setup lang="ts">
import { computed } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import CardUi from '@/components/ui/CardUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const siteSettings = useSiteSettingsStore()

const name = computed(() => siteSettings.siteSettings.identity.title)
// No domain field yet — derive a placeholder from the project name.
const url = computed(
  () => name.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.superbird.site',
)
const status = { label: 'Published', dot: 'bg-green-fg' }
</script>

<template>
  <CardUi icon="globe" title="Project" icon-class="bg-primary/10 text-primary">
    <dl class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
      <dt class="text-xs font-mono uppercase tracking-wider text-secondary/60">Name</dt>
      <dd class="truncate font-medium text-foreground">{{ name }}</dd>

      <dt class="text-xs font-mono uppercase tracking-wider text-secondary/60">URL</dt>
      <dd>
        <a
          :href="`https://${url}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 truncate text-primary hover:underline"
        >
          {{ url }}
          <IconUi name="external-link" size="size-3" class="shrink-0" />
        </a>
      </dd>

      <dt class="text-xs font-mono uppercase tracking-wider text-secondary/60">Status</dt>
      <dd>
        <span class="inline-flex items-center gap-1.5 rounded-lg bg-green-bg px-2 py-0.5 text-xs font-medium text-green-fg">
          <span :class="['size-1.5 rounded-full', status.dot]" />
          {{ status.label }}
        </span>
      </dd>
    </dl>

    <template #actions>
      <ButtonUi variant="outline" size="sm" :to="'/editor'">Open editor</ButtonUi>
      <a :href="`https://${url}`" target="_blank" rel="noopener noreferrer" class="ml-auto">
        <ButtonUi variant="ghost" size="sm">
          Visit site
          <IconUi name="external-link" size="size-3.5" />
        </ButtonUi>
      </a>
    </template>
  </CardUi>
</template>
