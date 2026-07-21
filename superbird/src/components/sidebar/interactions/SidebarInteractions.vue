<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { TRIGGER_TYPES, ACTION_PROPERTIES } from '@/constants/canvas'
import type { TriggerType, ActionProperty } from '@/types/canvas'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import InteractionList from './InteractionList.vue'
import ActionPickerPopover from './ActionPickerPopover.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const interactions = computed(() => {
  if (!node.value) return []
  return node.value.interactions ?? []
})

// --- Add interaction ---
const showAddTrigger = ref(false)

function addInteraction(trigger: TriggerType) {
  if (!node.value) return
  store.addInteraction(node.value.id, trigger)
  showAddTrigger.value = false
}

// --- Expanded state ---
const expandedIx = ref<string | null>(null)
const expandedStep = ref<string | null>(null)

function toggleIx(ixId: string) {
  expandedIx.value = expandedIx.value === ixId ? null : ixId
  expandedStep.value = null
}

function toggleStep(stepId: string) {
  expandedStep.value = expandedStep.value === stepId ? null : stepId
}

// --- Steps ---
function addStep(ixId: string) {
  if (!node.value) return
  const step = store.addStep(node.value.id, ixId)
  if (step) expandedStep.value = step.id
}

function removeStep(ixId: string, stepId: string) {
  if (!node.value) return
  store.removeStep(node.value.id, ixId, stepId)
  if (expandedStep.value === stepId) expandedStep.value = null
}

// --- Action picker ---
const showAddAction = ref<{ stepId: string; ixId: string } | null>(null)
const addActionPos = ref({ x: 0, y: 0 })

function openAddAction(e: MouseEvent, ixId: string, stepId: string) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  addActionPos.value = { x: rect.right, y: rect.bottom + 4 }
  showAddAction.value = showAddAction.value?.stepId === stepId ? null : { stepId, ixId }
}

function addAction(property: ActionProperty) {
  if (!node.value || !showAddAction.value) return
  const { ixId, stepId } = showAddAction.value
  const prop = ACTION_PROPERTIES.find((p) => p.key === property)
  store.addActionToStep(node.value.id, ixId, stepId, {
    property,
    from: prop?.key.includes('scale') ? '1' : prop?.key === 'opacity' ? '0' : '0' + (prop?.unit ?? ''),
    to: prop?.key.includes('scale') ? '1' : prop?.key === 'opacity' ? '1' : '0' + (prop?.unit ?? ''),
  })
  showAddAction.value = null
}
</script>

<template>
  <EmptyStateUi v-if="!node" message="Select an element to edit" />

  <div v-else class="p-3 space-y-3">
    <!-- Interaction list -->
    <InteractionList
      :interactions="interactions"
      :node-id="node.id"
      :expanded-ix-id="expandedIx"
      :expanded-step-id="expandedStep"
      @toggle-ix="toggleIx"
      @toggle-step="toggleStep"
      @add-step="addStep"
      @remove-step="removeStep"
      @open-action-picker="openAddAction"
    />

    <!-- Add interaction -->
    <div v-if="!showAddTrigger">
      <button
        class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 py-2.5 text-xs text-secondary cursor-pointer hover:border-foreground/30 hover:text-foreground transition-colors duration-150"
        @click="showAddTrigger = true"
      >
        <IconUi name="add" size="size-3.5" />
        Add Interaction
      </button>
    </div>

    <!-- Trigger picker -->
    <div v-else class="rounded-xl border border-foreground/10 p-2 space-y-1">
      <div class="flex items-center justify-between px-1 pb-1">
        <LabelUi>Choose Trigger</LabelUi>
        <button class="text-[10px] text-secondary cursor-pointer hover:text-foreground" @click="showAddTrigger = false">Cancel</button>
      </div>
      <button
        v-for="trigger in TRIGGER_TYPES"
        :key="trigger.key"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="addInteraction(trigger.key)"
      >
        <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-bg">
          <IconUi name="interactions" size="size-3 text-amber-fg" />
        </span>
        <span class="font-medium">{{ trigger.label }}</span>
      </button>
    </div>

    <!-- Teleported action picker dropdown -->
    <ActionPickerPopover
      v-if="showAddAction"
      :position="addActionPos"
      @select="addAction"
      @close="showAddAction = null"
    />
  </div>
</template>
