<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { ACTION_PROPERTIES } from '@/constants/canvas'
import type { AnimateAction, ClassAction, ClassOp, InteractionAction } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const props = defineProps<{
  nodeId: string
  ixId: string
  stepId: string
  action: InteractionAction
  index: number
}>()

const store = useCanvasStore()
const styles = useGlobalStylesStore()

const isClass = computed(() => props.action.type === 'class')
const asAnimate = computed(() => props.action as AnimateAction)
const asClass = computed(() => props.action as ClassAction)

const propertyLabel = computed(() =>
  isClass.value ? undefined : ACTION_PROPERTIES.find((p) => p.key === asAnimate.value.property)?.label,
)
const isColorAction = computed(
  () => asAnimate.value.property === 'background-color' || asAnimate.value.property === 'color',
)

const classOpOptions: { value: ClassOp; label: string }[] = [
  { value: 'add', label: 'Add' },
  { value: 'remove', label: 'Remove' },
  { value: 'toggle', label: 'Toggle' },
]

const classOptions = computed(() => [
  { value: '__custom__', label: 'Custom…', icon: 'plus', accentClass: 'text-purple-fg' },
  ...styles.allClassNames.map((c) => ({ value: c, label: c })),
])

const custom = ref(false)
watch(
  () => props.index,
  () => {
    const cn = props.action.type === 'class' ? props.action.className : ''
    custom.value = !!cn && !styles.allClassNames.includes(cn)
  },
  { immediate: true },
)

function onSelectClass(v: string) {
  if (v === '__custom__') {
    custom.value = true
    updateAction({ className: '' })
  } else {
    custom.value = false
    updateAction({ className: v })
  }
}

function updateAction(updates: Partial<AnimateAction> | Partial<ClassAction>) {
  store.updateActionInStep(props.nodeId, props.ixId, props.stepId, props.index, updates)
}
function removeAction() {
  store.removeActionFromStep(props.nodeId, props.ixId, props.stepId, props.index)
}
</script>

<template>
  <div v-if="isClass" class="flex items-center gap-1 rounded-lg bg-purple-bg/40 px-2 py-1.5">
    <div class="w-16 shrink-0">
      <DropdownUi
        class="w-full"
        :model-value="asClass.op"
        :options="classOpOptions"
        @update:model-value="(v: string) => updateAction({ op: v as ClassOp })"
      />
    </div>
    <DropdownUi
      v-if="!custom"
      class="min-w-0 flex-1"
      :model-value="asClass.className"
      :options="classOptions"
      placeholder="Class…"
      @update:model-value="onSelectClass"
    />
    <template v-else>
      <InputUi
        class="min-w-0 flex-1 font-mono"
        :model-value="asClass.className"
        size="xs"
        placeholder="class-name"
        @update:model-value="(v: string) => updateAction({ className: v })"
      />
      <IconButtonUi size="xs" title="Choose existing class" @click="custom = false">
        <IconUi name="list" size="size-2.5" />
      </IconButtonUi>
    </template>
    <IconButtonUi size="xs" variant="danger" title="Remove action" @click="removeAction">
      <IconUi name="close" size="size-2.5" />
    </IconButtonUi>
  </div>

  <div v-else class="flex items-center gap-1 rounded-lg bg-secondary/5 px-2 py-1.5">
    <span class="w-12 shrink-0 truncate font-mono text-[9px] text-secondary">{{ propertyLabel }}</span>
    <template v-if="isColorAction">
      <ColorInputUi :model-value="asAnimate.from" placeholder="from" @update:model-value="updateAction({ from: $event })" />
      <span class="text-[9px] text-secondary">→</span>
      <ColorInputUi :model-value="asAnimate.to" placeholder="to" @update:model-value="updateAction({ to: $event })" />
    </template>
    <template v-else>
      <InputUi :model-value="asAnimate.from" size="xs" placeholder="from" class="flex-1" @update:model-value="(v: string) => updateAction({ from: v })" />
      <span class="shrink-0 text-[9px] text-secondary">→</span>
      <InputUi :model-value="asAnimate.to" size="xs" placeholder="to" class="flex-1" @update:model-value="(v: string) => updateAction({ to: v })" />
    </template>
    <IconButtonUi size="xs" variant="danger" title="Remove action" @click="removeAction">
      <IconUi name="close" size="size-2.5" />
    </IconButtonUi>
  </div>
</template>
