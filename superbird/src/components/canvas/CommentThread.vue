<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCommentsStore, commentInitials } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { timeAgo, timeAgoShort, formatDateTime } from '@/lib/datetime'
import type { Comment } from '@shared/types'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import TextareaUi from '@/components/ui/TextareaUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import TooltipUi from '@/components/ui/TooltipUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'

const props = withDefaults(
  defineProps<{
    comment?: Comment | null
    align?: 'left' | 'right'
  }>(),
  { comment: null, align: 'left' },
)

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [body: string]
  cancel: []
}>()

const store = useCommentsStore()
const auth = useAuthStore()

const isCompose = computed(() => !props.comment)
const draftBody = ref('')
const replyBody = ref('')
const busy = ref(false)
const pendingDelete = ref(false)

function isMine(authorId: string) {
  return auth.currentUser?.id === authorId
}

async function submitDraft() {
  const body = draftBody.value.trim()
  if (!body) return
  emit('submit', body)
  draftBody.value = ''
}

async function postReply() {
  const c = props.comment
  const body = replyBody.value.trim()
  if (!c || !body) return
  busy.value = true
  try {
    await store.addReply(c.id, body)
    replyBody.value = ''
  } finally {
    busy.value = false
  }
}

async function toggleResolved() {
  const c = props.comment
  if (!c) return
  await store.setResolved(c.id, !c.resolved)
  if (!c.resolved) open.value = false
}

async function doDelete() {
  const c = props.comment
  if (!c) return
  await store.remove(c.id)
  pendingDelete.value = false
  open.value = false
}

watch(open, (v) => {
  if (!v) {
    draftBody.value = ''
    replyBody.value = ''
  }
})
</script>

<template>
  <PopoverUi
    v-model:open="open"
    :align="align"
    :backdrop="false"
    panel-class="w-72 rounded-2xl p-0 shadow-xl"
  >
    <div v-if="isCompose" class="p-3 space-y-2">
      <p class="text-[11px] font-mono uppercase tracking-wider text-secondary">New comment</p>
      <TextareaUi v-model="draftBody" placeholder="Write a comment…" :rows="3" @keydown.meta.enter="submitDraft" @keydown.ctrl.enter="submitDraft" />
      <div class="flex items-center justify-end gap-1.5">
        <ButtonUi variant="ghost" size="sm" @click="emit('cancel')">Cancel</ButtonUi>
        <ButtonUi variant="solid" size="sm" :disabled="!draftBody.trim()" @click="submitDraft">Comment</ButtonUi>
      </div>
    </div>

    <div v-else-if="comment" class="flex max-h-[70vh] flex-col">
      <div class="space-y-2 p-3">
        <div class="flex items-center gap-2">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[10px] font-mono font-medium text-secondary">
            {{ commentInitials(comment.authorName) }}
          </span>
          <span class="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{{ comment.authorName }}</span>
          <BadgeUi v-if="isMine(comment.authorId)" variant="primary" size="xs" mono>You</BadgeUi>
          <TooltipUi :content="formatDateTime(comment.createdAt)">
            <span class="text-[10px] text-secondary/70">{{ timeAgo(comment.createdAt) }}</span>
          </TooltipUi>
        </div>
        <p class="whitespace-pre-wrap break-words text-sm text-foreground">{{ comment.body }}</p>
      </div>

      <div v-if="comment.replies.length" class="space-y-2 border-t border-foreground/8 p-3">
        <div v-for="reply in comment.replies" :key="reply.id" class="group flex gap-2">
          <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[9px] font-mono font-medium text-secondary">
            {{ commentInitials(reply.authorName) }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-[11px] font-medium text-foreground">{{ reply.authorName }}</span>
              <span class="text-[10px] text-secondary/60">{{ timeAgoShort(reply.createdAt) }}</span>
              <ButtonUi
                v-if="isMine(reply.authorId)"
                variant="bare"
                square
                size="xs"
                icon="delete"
                title="Delete reply"
                class="ml-auto opacity-0 group-hover:opacity-100"
                @click="store.removeReply(comment.id, reply.id)"
              />
            </div>
            <p class="whitespace-pre-wrap break-words text-[13px] text-foreground/90">{{ reply.body }}</p>
          </div>
        </div>
      </div>

      <div class="border-t border-foreground/8 p-2">
        <TextareaUi v-model="replyBody" placeholder="Reply…" :rows="2" @keydown.meta.enter="postReply" @keydown.ctrl.enter="postReply" />
      </div>

      <div class="flex items-center gap-1.5 border-t border-foreground/8 p-2">
        <ButtonUi
          :variant="comment.resolved ? 'ghost' : 'outline'"
          size="sm"
          :icon="comment.resolved ? 'eye' : 'check'"
          @click="toggleResolved"
        >
          {{ comment.resolved ? 'Reopen' : 'Resolve' }}
        </ButtonUi>
        <ButtonUi
          v-if="isMine(comment.authorId)"
          variant="bare"
          square
          size="sm"
          icon="delete"
          title="Delete comment"
          @click="pendingDelete = true"
        />
        <ButtonUi
          variant="solid"
          size="sm"
          class="ml-auto"
          :disabled="!replyBody.trim() || busy"
          @click="postReply"
        >
          Reply
        </ButtonUi>
      </div>
    </div>
  </PopoverUi>

  <ConfirmDialogUi
    :open="pendingDelete"
    title="Delete comment"
    description="This deletes the whole thread, including all replies. This can’t be undone."
    confirm-label="Delete"
    @update:open="pendingDelete = false"
    @confirm="doDelete"
  />
</template>
