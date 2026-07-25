<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSubmissionsStore, type Submission } from '@/stores/submissions'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import { timeAgoShort } from '@/lib/datetime'

const emit = defineEmits<{ view: [] }>()

const store = useSubmissionsStore()
onMounted(() => { if (!store.loaded) store.load() })

const recent = computed(() => store.items.slice(0, 4))
const newCount = computed(() => store.items.filter((s) => !s.seen).length)

function primary(s: Submission): string {
  return Object.values(s.data).filter(Boolean)[0] ?? '—'
}
</script>

<template>
  <CardUi size="sm" icon="submissions" title="Form submissions">
    <template #header-action>
      <BadgeUi v-if="newCount > 0" variant="info" size="xs" dot>{{ newCount }} new</BadgeUi>
    </template>

    <div v-if="recent.length" class="flex flex-col gap-1">
      <div
        v-for="s in recent"
        :key="s.id"
        class="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
      >
        <span v-if="!s.seen" class="size-1.5 shrink-0 rounded-full bg-blue-fg" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-foreground">{{ primary(s) }}</p>
          <p class="truncate text-[10px] text-secondary">{{ s.formName }}</p>
        </div>
        <span class="shrink-0 text-[10px] text-secondary/60">{{ timeAgoShort(s.createdAt) }}</span>
      </div>
    </div>
    <p v-else class="rounded-xl bg-background px-3 py-4 text-center text-[10px] text-secondary">No submissions yet.</p>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1" @click="emit('view')">
        View all
        <IconUi name="arrow-right" size="size-3" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
