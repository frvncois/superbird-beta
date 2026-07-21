<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { TRIGGER_TYPES, TARGET_TYPES, ACTION_PROPERTIES, EASING_OPTIONS, type TriggerType, type Interaction, type InteractionStep, type ActionProperty } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'

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

function removeInteraction(ixId: string) {
  if (!node.value) return
  store.removeInteraction(node.value.id, ixId)
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

// --- Actions ---
const showAddAction = ref<{ stepId: string; ixId: string } | null>(null)
const addActionPos = ref({ x: 0, y: 0 })

function openAddAction(e: MouseEvent, ixId: string, stepId: string) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  addActionPos.value = { x: rect.right, y: rect.bottom + 4 }
  showAddAction.value = showAddAction.value?.stepId === stepId ? null : { stepId, ixId }
}

function addAction(ixId: string, stepId: string, property: ActionProperty) {
  if (!node.value) return
  const prop = ACTION_PROPERTIES.find((p) => p.key === property)
  store.addActionToStep(node.value.id, ixId, stepId, {
    property,
    from: prop?.key.includes('scale') ? '1' : prop?.key === 'opacity' ? '0' : '0' + (prop?.unit ?? ''),
    to: prop?.key.includes('scale') ? '1' : prop?.key === 'opacity' ? '1' : '0' + (prop?.unit ?? ''),
  })
  showAddAction.value = null
}

function removeAction(ixId: string, stepId: string, idx: number) {
  if (!node.value) return
  store.removeActionFromStep(node.value.id, ixId, stepId, idx)
}

function isColorAction(property: ActionProperty): boolean {
  return property === 'background-color' || property === 'color'
}

// Group action properties
const actionGroups = computed(() => {
  const groups: Record<string, typeof ACTION_PROPERTIES> = {}
  for (const prop of ACTION_PROPERTIES) {
    ;(groups[prop.group] ??= []).push(prop)
  }
  return groups
})

const triggerOptions = TRIGGER_TYPES.map((t) => ({ value: t.key, label: t.label }))
const targetOptions = TARGET_TYPES.map((t) => ({ value: t.key, label: t.label }))
const easingOptions = EASING_OPTIONS.map((e) => ({ value: e.key, label: e.label }))
</script>

<template>
  <div v-if="!node" class="flex items-center justify-center py-12 text-xs text-secondary">
    Select an element to edit
  </div>

  <div v-else class="p-3 space-y-3">
    <!-- Interaction list -->
    <div
      v-for="ix in interactions"
      :key="ix.id"
      class="rounded-xl border border-foreground/10 overflow-hidden"
    >
      <!-- Interaction header -->
      <div
        class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/5 transition-colors duration-100"
        @click="toggleIx(ix.id)"
      >
        <svg :class="['size-3 text-secondary transition-transform duration-150', expandedIx === ix.id && 'rotate-90']" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium truncate">{{ ix.name }}</div>
          <div class="text-[9px] text-secondary font-mono">{{ ix.trigger }} · {{ ix.steps.length }} steps</div>
        </div>
        <button
          class="flex size-5 shrink-0 items-center justify-center rounded text-secondary/40 cursor-pointer hover:text-red-fg hover:bg-red-bg transition-colors duration-100"
          @click.stop="removeInteraction(ix.id)"
        >
          <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <!-- Interaction body -->
      <div v-if="expandedIx === ix.id" class="border-t border-foreground/8 px-3 py-2 space-y-3">
        <!-- Trigger config -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-mono uppercase tracking-wider text-secondary">Trigger</span>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Type</span>
            <SelectUi
              :model-value="ix.trigger"
              :options="triggerOptions"
              @update:model-value="(v: string) => store.updateInteraction(node!.id, ix.id, { trigger: v as TriggerType })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Name</span>
            <InputUi
              :model-value="ix.name"
              placeholder="Interaction name"
              @update:model-value="(v: string) => store.updateInteraction(node!.id, ix.id, { name: v })"
            />
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-1.5">
          <span class="text-[10px] font-mono uppercase tracking-wider text-secondary">Options</span>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-xs text-foreground">Loop</span>
            <button
              :class="['relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer', ix.options.loop ? 'bg-foreground' : 'bg-foreground/20']"
              @click="store.updateInteraction(node!.id, ix.id, { options: { ...ix.options, loop: !ix.options.loop } })"
            >
              <span :class="['absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200', ix.options.loop && 'translate-x-4']" />
            </button>
          </label>
          <label v-if="ix.trigger === 'hover' || ix.trigger === 'scroll-into-view'" class="flex items-center justify-between cursor-pointer">
            <span class="text-xs text-foreground">Reset on exit</span>
            <button
              :class="['relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer', ix.options.resetOnExit ? 'bg-foreground' : 'bg-foreground/20']"
              @click="store.updateInteraction(node!.id, ix.id, { options: { ...ix.options, resetOnExit: !ix.options.resetOnExit } })"
            >
              <span :class="['absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200', ix.options.resetOnExit && 'translate-x-4']" />
            </button>
          </label>
        </div>

        <!-- Steps -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-secondary">Steps</span>
            <button
              class="flex items-center gap-0.5 text-[10px] text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
              @click="addStep(ix.id)"
            >
              <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add
            </button>
          </div>

          <!-- Step list -->
          <div
            v-for="(step, sIdx) in ix.steps"
            :key="step.id"
            class="rounded-lg border border-foreground/8 overflow-hidden"
          >
            <!-- Step header -->
            <div
              class="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/5 cursor-pointer hover:bg-secondary/8 transition-colors duration-100"
              @click="toggleStep(step.id)"
            >
              <span class="text-[10px] font-mono text-secondary w-4">{{ sIdx + 1 }}</span>
              <div class="flex-1 min-w-0">
                <span class="text-[10px] font-medium">{{ step.target.type === 'self' ? 'Self' : step.target.type + (step.target.value ? ': ' + step.target.value : '') }}</span>
                <span class="text-[9px] text-secondary ml-1">{{ step.duration }}ms</span>
              </div>
              <span class="text-[9px] font-mono text-secondary/50">{{ step.actions.length }} actions</span>
              <button
                class="flex size-4 items-center justify-center rounded text-secondary/30 cursor-pointer hover:text-red-fg transition-colors duration-100"
                @click.stop="removeStep(ix.id, step.id)"
              >
                <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <!-- Step body -->
            <div v-if="expandedStep === step.id" class="px-2.5 py-2 space-y-2 border-t border-foreground/5">
              <!-- Target -->
              <div class="flex items-center gap-2">
                <span class="w-12 text-[10px] text-secondary">Target</span>
                <SelectUi
                  :model-value="step.target.type"
                  :options="targetOptions"
                  @update:model-value="(v: string) => store.updateStep(node!.id, ix.id, step.id, { target: { type: v as any, value: step.target.value } })"
                />
              </div>
              <div v-if="step.target.type === 'class' || step.target.type === 'id' || step.target.type === 'child'" class="flex items-center gap-2">
                <span class="w-12 text-[10px] text-secondary">Value</span>
                <InputUi
                  :model-value="step.target.value ?? ''"
                  :placeholder="step.target.type === 'class' ? '.class-name' : step.target.type === 'id' ? '#element-id' : 'Child label'"
                  @update:model-value="(v: string) => store.updateStep(node!.id, ix.id, step.id, { target: { type: step.target.type, value: v } })"
                />
              </div>

              <!-- Timing -->
              <div class="grid grid-cols-3 gap-1.5">
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Delay</span>
                  <input
                    type="number"
                    :value="step.delay"
                    class="h-7 w-full min-w-0 rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground outline-none focus:border-foreground/40"
                    @input="store.updateStep(node!.id, ix.id, step.id, { delay: Number(($event.target as HTMLInputElement).value) })"
                  />
                </div>
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Duration</span>
                  <input
                    type="number"
                    :value="step.duration"
                    class="h-7 w-full min-w-0 rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground outline-none focus:border-foreground/40"
                    @input="store.updateStep(node!.id, ix.id, step.id, { duration: Number(($event.target as HTMLInputElement).value) })"
                  />
                </div>
                <div class="space-y-0.5">
                  <span class="text-[9px] text-secondary">Stagger</span>
                  <input
                    type="number"
                    :value="step.stagger ?? 0"
                    class="h-7 w-full min-w-0 rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground outline-none focus:border-foreground/40"
                    @input="store.updateStep(node!.id, ix.id, step.id, { stagger: Number(($event.target as HTMLInputElement).value) || undefined })"
                  />
                </div>
              </div>

              <!-- Easing -->
              <div class="flex items-center gap-2">
                <span class="w-12 text-[10px] text-secondary">Easing</span>
                <SelectUi
                  :model-value="step.easing"
                  :options="easingOptions"
                  @update:model-value="(v: string) => store.updateStep(node!.id, ix.id, step.id, { easing: v })"
                />
              </div>

              <!-- Actions -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] font-mono uppercase tracking-wider text-secondary">Actions</span>
                  <button
                    class="text-[10px] text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
                    @click.stop="openAddAction($event, ix.id, step.id)"
                  >
                    + Add
                  </button>
                </div>

                <!-- Action rows -->
                <div
                  v-for="(action, aIdx) in step.actions"
                  :key="aIdx"
                  class="flex items-center gap-1 rounded-lg bg-secondary/5 px-2 py-1.5"
                >
                  <span class="w-12 text-[9px] font-mono text-secondary shrink-0 truncate">{{ ACTION_PROPERTIES.find(p => p.key === action.property)?.label }}</span>
                  <template v-if="isColorAction(action.property)">
                    <ColorInputUi
                      :model-value="action.from"
                      placeholder="from"
                      @update:model-value="store.updateActionInStep(node!.id, ix.id, step.id, aIdx, { from: $event })"
                    />
                    <span class="text-[9px] text-secondary">→</span>
                    <ColorInputUi
                      :model-value="action.to"
                      placeholder="to"
                      @update:model-value="store.updateActionInStep(node!.id, ix.id, step.id, aIdx, { to: $event })"
                    />
                  </template>
                  <template v-else>
                    <input
                      :value="action.from"
                      placeholder="from"
                      class="h-6 min-w-0 flex-1 rounded border border-foreground/10 bg-transparent px-1.5 text-[10px] font-mono text-foreground outline-none focus:border-foreground/30"
                      @input="store.updateActionInStep(node!.id, ix.id, step.id, aIdx, { from: ($event.target as HTMLInputElement).value })"
                    />
                    <span class="text-[9px] text-secondary shrink-0">→</span>
                    <input
                      :value="action.to"
                      placeholder="to"
                      class="h-6 min-w-0 flex-1 rounded border border-foreground/10 bg-transparent px-1.5 text-[10px] font-mono text-foreground outline-none focus:border-foreground/30"
                      @input="store.updateActionInStep(node!.id, ix.id, step.id, aIdx, { to: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                  <button
                    class="flex size-4 shrink-0 items-center justify-center rounded text-secondary/30 cursor-pointer hover:text-red-fg transition-colors duration-100"
                    @click="removeAction(ix.id, step.id, aIdx)"
                  >
                    <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add interaction -->
    <div v-if="!showAddTrigger">
      <button
        class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/15 py-2.5 text-xs text-secondary cursor-pointer hover:border-foreground/30 hover:text-foreground transition-colors duration-150"
        @click="showAddTrigger = true"
      >
        <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Add Interaction
      </button>
    </div>

    <!-- Trigger picker -->
    <div v-else class="rounded-xl border border-foreground/10 p-2 space-y-1">
      <div class="flex items-center justify-between px-1 pb-1">
        <span class="text-[10px] font-mono uppercase tracking-wider text-secondary">Choose Trigger</span>
        <button class="text-[10px] text-secondary cursor-pointer hover:text-foreground" @click="showAddTrigger = false">Cancel</button>
      </div>
      <button
        v-for="trigger in TRIGGER_TYPES"
        :key="trigger.key"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
        @click="addInteraction(trigger.key)"
      >
        <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-bg">
          <svg class="size-3 text-amber-fg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
          </svg>
        </span>
        <span class="font-medium">{{ trigger.label }}</span>
      </button>
    </div>

    <!-- Teleported action picker dropdown -->
    <Teleport to="body">
      <template v-if="showAddAction">
        <div class="fixed inset-0 z-[9998]" @click="showAddAction = null" />
        <div
          class="fixed z-[9999] w-36 max-h-64 overflow-y-auto rounded-xl border bg-background p-1 shadow-lg"
          :style="{ left: `${addActionPos.x - 144}px`, top: `${addActionPos.y}px` }"
        >
          <template v-for="(props, group) in actionGroups" :key="group">
            <div class="px-2 pt-1.5 pb-0.5 text-[8px] font-mono uppercase tracking-wider text-secondary/50">{{ group }}</div>
            <button
              v-for="prop in props"
              :key="prop.key"
              class="flex w-full items-center rounded-lg px-2 py-1 text-[10px] cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
              @click="addAction(showAddAction!.ixId, showAddAction!.stepId, prop.key)"
            >
              {{ prop.label }}
            </button>
          </template>
        </div>
      </template>
    </Teleport>
  </div>
</template>
