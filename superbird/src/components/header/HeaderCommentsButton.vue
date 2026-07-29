<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommentsStore, commentInitials } from '@/stores/comments'
import { useCanvasStore } from '@/stores/canvas'
import { timeAgoShort } from '@/lib/datetime'
import type { Comment } from '@shared/types'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import TooltipUi from '@/components/ui/TooltipUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

const store = useCommentsStore()
const canvas = useCanvasStore()

const isOpen = ref(false)
const filter = ref<'open' | 'resolved'>('open')

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const hint = computed(() => `${isMac ? '⌘' : 'Ctrl'}-click the canvas to add a comment`)

const filtered = computed(() => {
  const wantResolved = filter.value === 'resolved'
  return store.items
    .filter((c) => c.resolved === wantResolved)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function pageName(id: string): string {
  return canvas.pages.find((p) => p.id === id)?.name ?? 'Page'
}

function select(c: Comment) {
  if (canvas.activePageId !== c.pageId) canvas.setActivePage(c.pageId)
  store.requestFocus(c.id)
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <TooltipUi content="Comments" placement="bottom" :disabled="isOpen">
      <ButtonUi variant="outline" size="sm" icon="comment" @click="isOpen = !isOpen">
        <span v-if="store.unresolvedCount" class="font-mono text-[11px] font-medium">{{ store.unresolvedCount }}</span>
      </ButtonUi>
    </TooltipUi>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-80 rounded-2xl p-1.5">
      <div class="space-y-1.5">
        <div class="px-1 pt-0.5">
          <SegmentedControlUi
            v-model="filter"
            size="xs"
            grow
            :options="[{ value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }]"
          />
        </div>

        <div class="max-h-[60vh] space-y-0.5 overflow-y-auto">
          <button
            v-for="c in filtered"
            :key="c.id"
            type="button"
            class="flex w-full items-start gap-2 rounded-xl p-2 text-left transition-colors hover:bg-secondary/8"
            @click="select(c)"
          >
            <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[10px] font-mono font-medium text-secondary">
              {{ commentInitials(c.authorName) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1.5">
                <span class="truncate text-xs font-medium text-foreground">{{ c.authorName }}</span>
                <span class="ml-auto shrink-0 text-[10px] text-secondary/60">{{ timeAgoShort(c.updatedAt) }}</span>
              </span>
              <span class="line-clamp-2 block text-[13px] text-foreground/80">{{ c.body }}</span>
              <span class="mt-0.5 flex items-center gap-1 text-[10px] text-secondary/70">
                <IconUi name="document" size="size-2.5" />
                <span class="truncate">{{ pageName(c.pageId) }}</span>
                <span v-if="c.replies.length">· {{ c.replies.length }} repl{{ c.replies.length === 1 ? 'y' : 'ies' }}</span>
              </span>
            </span>
          </button>

          <EmptyStateUi
            v-if="!filtered.length"
            compact
            :message="filter === 'resolved' ? 'No resolved comments.' : 'No open comments yet.'"
          />
        </div>

        <div class="flex items-center gap-1.5 border-t border-foreground/8 px-2 py-1.5 text-[11px] text-secondary">
          <IconUi name="comment" size="size-3" />
          <span>{{ hint }}</span>
        </div>
      </div>
    </PopoverUi>
  </div>
</template>
