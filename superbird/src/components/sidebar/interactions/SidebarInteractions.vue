<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { TRIGGER_TYPES } from '@/constants/canvas'
import type { TriggerType } from '@/types/canvas'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import InteractionDetail from './InteractionDetail.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)
const interactions = computed(() => node.value?.interactions ?? [])

// The interaction currently open for editing (master-detail).
const openInteraction = computed(
  () => interactions.value.find((ix) => ix.id === store.openInteractionId) ?? null,
)

function triggerLabel(trigger: TriggerType): string {
  return TRIGGER_TYPES.find((t) => t.key === trigger)?.label ?? trigger
}

function openIx(id: string) {
  store.setOpenInteraction(id)
}
function removeInteraction(id: string) {
  if (node.value) store.removeInteraction(node.value.id, id)
}

// Add interaction → drill straight into it.
const showAddTrigger = ref(false)
function addInteraction(trigger: TriggerType) {
  if (!node.value) return
  const ix = store.addInteraction(node.value.id, trigger)
  showAddTrigger.value = false
  if (ix) store.setOpenInteraction(ix.id)
}
</script>

<template>
  <EmptyStateUi v-if="!node" message="Select an element to edit" />

  <!-- Detail: editing a single interaction -->
  <InteractionDetail
    v-else-if="openInteraction"
    :node-id="node.id"
    :interaction="openInteraction"
    @back="store.setOpenInteraction(null)"
  />

  <!-- List -->
  <div v-else class="space-y-2 p-3">
    <div v-if="interactions.length" class="space-y-1.5">
      <div
        v-for="ix in interactions"
        :key="ix.id"
        class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-foreground/10 px-3 py-2.5 transition-colors duration-100 hover:border-foreground/20 hover:bg-secondary/5"
        @click="openIx(ix.id)"
      >
        <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-bg text-amber-fg">
          <IconUi name="interactions" size="size-3.5" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs font-medium text-foreground">{{ ix.name }}</div>
          <div class="font-mono text-[10px] text-secondary">
            {{ triggerLabel(ix.trigger) }} · {{ ix.steps.length }} {{ ix.steps.length === 1 ? 'step' : 'steps' }}
          </div>
        </div>
        <IconButtonUi size="sm" variant="danger" title="Remove interaction" @click.stop="removeInteraction(ix.id)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
        <IconUi name="chevron-right" size="size-3" class="shrink-0 text-secondary/40" />
      </div>
    </div>
    <EmptyStateUi v-else compact message="No interactions yet" />

    <!-- Add interaction -->
    <button
      v-if="!showAddTrigger"
      class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 py-2.5 text-xs text-secondary cursor-pointer hover:border-foreground/30 hover:text-foreground transition-colors duration-150"
      @click="showAddTrigger = true"
    >
      <IconUi name="add" size="size-3.5" /> Add interaction
    </button>

    <!-- Trigger picker -->
    <div v-else class="space-y-1 rounded-xl border border-foreground/10 p-2">
      <div class="flex items-center justify-between px-1 pb-1">
        <LabelUi>Choose trigger</LabelUi>
        <button class="text-[10px] text-secondary cursor-pointer hover:text-foreground" @click="showAddTrigger = false">Cancel</button>
      </div>
      <button
        v-for="trigger in TRIGGER_TYPES"
        :key="trigger.key"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="addInteraction(trigger.key)"
      >
        <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-bg text-amber-fg">
          <IconUi name="interactions" size="size-3" />
        </span>
        <span class="font-medium">{{ trigger.label }}</span>
      </button>
    </div>
  </div>
</template>
