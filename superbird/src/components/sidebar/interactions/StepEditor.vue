<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { TARGET_TYPES, EASING_OPTIONS } from '@/constants/canvas'
import type { InteractionStep, TargetType } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import ActionEditor from './ActionEditor.vue'

const props = defineProps<{
  nodeId: string
  ixId: string
  step: InteractionStep
  index: number
  expanded: boolean
}>()

const emit = defineEmits<{
  toggle: []
  remove: []
  openActionPicker: [e: MouseEvent]
}>()

const store = useCanvasStore()

const targetOptions = TARGET_TYPES.map((t) => ({ value: t.key, label: t.label }))
const easingOptions = EASING_OPTIONS.map((e) => ({ value: e.key, label: e.label }))

function updateStep(
  updates: Partial<Pick<InteractionStep, 'target' | 'delay' | 'duration' | 'easing' | 'stagger'>>,
) {
  store.updateStep(props.nodeId, props.ixId, props.step.id, updates)
}
</script>

<template>
  <div class="rounded-lg border border-foreground/8 overflow-hidden">
    <!-- Step header -->
    <div
      class="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/5 cursor-pointer hover:bg-secondary/8 transition-colors duration-100"
      @click="emit('toggle')"
    >
      <span class="text-[10px] font-mono text-secondary w-4">{{ index + 1 }}</span>
      <div class="flex-1 min-w-0">
        <span class="text-[10px] font-medium">{{ step.target.type === 'self' ? 'Self' : step.target.type + (step.target.value ? ': ' + step.target.value : '') }}</span>
        <span class="text-[9px] text-secondary ml-1">{{ step.duration }}ms</span>
      </div>
      <span class="text-[9px] font-mono text-secondary/50">{{ step.actions.length }} actions</span>
      <IconButtonUi size="xs" variant="danger" title="Remove step" @click.stop="emit('remove')">
        <IconUi name="close" size="size-2.5" />
      </IconButtonUi>
    </div>

    <!-- Step body -->
    <div v-if="expanded" class="px-2.5 py-2 space-y-2 border-t border-foreground/5">
      <!-- Target -->
      <FieldRowUi label="Target" label-width="sm">
        <SelectUi
          :model-value="step.target.type"
          :options="targetOptions"
          @update:model-value="(v: string) => updateStep({ target: { type: v as TargetType, value: step.target.value } })"
        />
      </FieldRowUi>
      <FieldRowUi
        v-if="step.target.type === 'class' || step.target.type === 'id' || step.target.type === 'child'"
        label="Value"
        label-width="sm"
      >
        <InputUi
          :model-value="step.target.value ?? ''"
          :placeholder="step.target.type === 'class' ? '.class-name' : step.target.type === 'id' ? '#element-id' : 'Child label'"
          @update:model-value="(v: string) => updateStep({ target: { type: step.target.type, value: v } })"
        />
      </FieldRowUi>

      <!-- Timing -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="space-y-0.5">
          <span class="text-[9px] text-secondary">Delay</span>
          <InputUi
            type="number"
            size="xs"
            :model-value="String(step.delay)"
            @update:model-value="(v: string) => updateStep({ delay: Number(v) })"
          />
        </div>
        <div class="space-y-0.5">
          <span class="text-[9px] text-secondary">Duration</span>
          <InputUi
            type="number"
            size="xs"
            :model-value="String(step.duration)"
            @update:model-value="(v: string) => updateStep({ duration: Number(v) })"
          />
        </div>
        <div class="space-y-0.5">
          <span class="text-[9px] text-secondary">Stagger</span>
          <InputUi
            type="number"
            size="xs"
            :model-value="String(step.stagger ?? 0)"
            @update:model-value="(v: string) => updateStep({ stagger: Number(v) || undefined })"
          />
        </div>
      </div>

      <!-- Easing -->
      <FieldRowUi label="Easing" label-width="sm">
        <SelectUi
          :model-value="step.easing"
          :options="easingOptions"
          @update:model-value="(v: string) => updateStep({ easing: v })"
        />
      </FieldRowUi>

      <!-- Actions -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between">
          <LabelUi size="xs">Actions</LabelUi>
          <button
            class="text-[10px] text-secondary cursor-pointer hover:text-foreground transition-colors duration-100"
            @click.stop="emit('openActionPicker', $event)"
          >
            + Add
          </button>
        </div>

        <ActionEditor
          v-for="(action, aIdx) in step.actions"
          :key="aIdx"
          :node-id="nodeId"
          :ix-id="ixId"
          :step-id="step.id"
          :action="action"
          :index="aIdx"
        />
      </div>
    </div>
  </div>
</template>
