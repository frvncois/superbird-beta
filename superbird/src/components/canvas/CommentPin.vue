<script setup lang="ts">
import { computed } from 'vue'
import { commentInitials } from '@/stores/comments'
import type { Comment } from '@shared/types'
import IconUi from '@/components/ui/IconUi.vue'
import CommentThread from './CommentThread.vue'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    comment?: Comment | null // null → draft/compose pin
    focused?: boolean
  }>(),
  { comment: null, focused: false },
)

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [body: string]
  cancel: []
}>()

const isDraft = computed(() => !props.comment)
const resolved = computed(() => props.comment?.resolved ?? false)
// Anchor the thread to whichever side has more room.
const align = computed<'left' | 'right'>(() => (props.x > 600 ? 'right' : 'left'))

const markerClass = computed(() => {
  if (isDraft.value) return 'bg-primary text-white ring-2 ring-white'
  if (resolved.value) return 'bg-white text-secondary ring-1 ring-secondary/40'
  return 'bg-primary text-white ring-2 ring-white'
})
</script>

<template>
  <div
    class="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-1/2"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <button
      type="button"
      :class="[
        'flex size-7 items-center justify-center rounded-full rounded-bl-none text-[11px] font-mono font-semibold shadow-md transition-transform duration-100 hover:scale-110',
        markerClass,
        focused && 'ring-2 ring-primary ring-offset-2 ring-offset-white',
        open && 'scale-110',
      ]"
      :title="comment?.body"
      @click.stop="open = !open"
    >
      <IconUi v-if="isDraft" name="comment" size="size-3.5" />
      <template v-else>{{ commentInitials(comment!.authorName) }}</template>
    </button>

    <CommentThread
      v-model:open="open"
      :comment="comment"
      :align="align"
      @submit="emit('submit', $event)"
      @cancel="emit('cancel')"
    />
  </div>
</template>
