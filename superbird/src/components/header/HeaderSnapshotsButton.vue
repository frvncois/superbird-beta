<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSnapshotsStore } from '@/stores/snapshots'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useToast } from '@/composables/useToast'
import { timeAgoShort, formatDateTime } from '@/lib/datetime'
import type { Snapshot, SnapshotReason } from '@shared/types'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import TooltipUi from '@/components/ui/TooltipUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'

const snapshots = useSnapshotsStore()
const toast = useToast()

const isOpen = ref(false)
const creating = ref(false)
const pendingRestore = ref<Snapshot | null>(null)
const pendingDelete = ref<Snapshot | null>(null)

watch(isOpen, (open) => {
  if (open) void snapshots.load()
})

const DOT: Record<SnapshotReason, string> = {
  publish: 'bg-green-fg',
  manual: 'bg-primary',
  'mcp-before': 'bg-purple-fg',
  'mcp-after': 'bg-purple-fg',
  open: 'bg-blue-fg',
  auto: 'bg-secondary/40',
}

async function createManual() {
  if (creating.value) return
  creating.value = true
  try {
    await useProjectPersistence().save()
    const res = await snapshots.create({ reason: 'manual' })
    toast.success(res.deduped ? 'No changes since the last snapshot' : 'Snapshot created')
  } catch {
    toast.error('Couldn’t create the snapshot.')
  } finally {
    creating.value = false
  }
}

function preview(s: Snapshot) {
  isOpen.value = false
  void snapshots.openPreview(s.id)
}

async function doRestore() {
  const s = pendingRestore.value
  pendingRestore.value = null
  if (!s) return
  await snapshots.restore(s.id)
  isOpen.value = false
  toast.success('Snapshot restored')
}

async function doDelete() {
  const s = pendingDelete.value
  pendingDelete.value = null
  if (s) await snapshots.remove(s.id)
}
</script>

<template>
  <div class="relative">
    <TooltipUi content="Version history" placement="bottom" :disabled="isOpen">
      <ButtonUi variant="outline" size="sm" icon="history" @click="isOpen = !isOpen" />
    </TooltipUi>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-80 rounded-2xl p-1.5">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between px-1 pt-0.5">
          <span class="font-mono text-[10px] uppercase tracking-wider text-secondary/60">Version history</span>
          <ButtonUi variant="ghost" size="xs" icon="plus" :disabled="creating" @click="createManual">
            {{ creating ? 'Saving…' : 'Snapshot' }}
          </ButtonUi>
        </div>

        <div class="max-h-[60vh] space-y-2 overflow-y-auto">
          <div v-for="group in snapshots.grouped" :key="group.key">
            <div class="px-2 pb-0.5 pt-1 font-mono text-[9px] uppercase tracking-wider text-secondary/50">
              {{ group.label }}
            </div>
            <div
              v-for="s in group.items"
              :key="s.id"
              class="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary/8"
            >
              <span class="size-1.5 shrink-0 rounded-full" :class="DOT[s.reason]" />
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-medium text-foreground">{{ s.label }}</div>
                <TooltipUi :content="formatDateTime(s.createdAt)">
                  <span class="text-[10px] text-secondary/70">{{ s.authorName }} · {{ timeAgoShort(s.createdAt) }}</span>
                </TooltipUi>
              </div>
              <IconUi v-if="s.pinned" name="pin" size="size-3" class="shrink-0 text-primary group-hover:hidden" title="Pinned" />
              <div class="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <ButtonUi variant="bare" square size="xs" icon="eye" title="Preview" @click="preview(s)" />
                <ButtonUi variant="bare" square size="xs" icon="history" title="Restore this version" @click="pendingRestore = s" />
                <ButtonUi
                  variant="bare"
                  square
                  size="xs"
                  icon="pin"
                  :title="s.pinned ? 'Unpin' : 'Pin (protect from auto-cleanup)'"
                  :class="s.pinned && '!text-primary'"
                  @click="snapshots.setPinned(s.id, !s.pinned)"
                />
                <ButtonUi variant="bare" square size="xs" icon="delete" title="Delete" @click="pendingDelete = s" />
              </div>
            </div>
          </div>

          <EmptyStateUi v-if="!snapshots.items.length" compact message="No snapshots yet." />
        </div>
      </div>
    </PopoverUi>

    <ConfirmDialogUi
      :open="!!pendingRestore"
      title="Restore snapshot"
      :description="pendingRestore ? `Restore “${pendingRestore.label}” (${timeAgoShort(pendingRestore.createdAt)} ago)? Your current working version is saved as a snapshot first, so you can undo this.` : ''"
      confirm-label="Restore"
      :danger="false"
      @update:open="pendingRestore = null"
      @confirm="doRestore"
    />

    <ConfirmDialogUi
      :open="!!pendingDelete"
      title="Delete snapshot"
      :description="pendingDelete ? `Delete “${pendingDelete.label}”? This can’t be undone.` : ''"
      confirm-label="Delete"
      @update:open="pendingDelete = null"
      @confirm="doDelete"
    />
  </div>
</template>
