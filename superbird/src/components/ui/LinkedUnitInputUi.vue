<script setup lang="ts">
import { ref } from 'vue'
import UnitInputUi from './UnitInputUi.vue'
import LabelUi from './LabelUi.vue'

withDefaults(
  defineProps<{
    labels?: [string, string, string, string]
    units?: string[]
    allowAuto?: boolean
  }>(),
  {
    labels: () => ['Top', 'Right', 'Bottom', 'Left'] as [string, string, string, string],
    units: () => ['px', '%', 'em', 'rem', 'vw', 'vh'],
    allowAuto: false,
  },
)

const model = defineModel<[string, string, string, string]>({
  default: () => ['', '', '', ''],
})

const linked = ref(isAllSame())

function isAllSame(): boolean {
  const vals = model.value
  if (vals.every((v) => !v)) return true
  return vals[0] === vals[1] && vals[1] === vals[2] && vals[2] === vals[3]
}

function updateValue(index: number, value: string) {
  if (linked.value) {
    model.value = [value, value, value, value]
  } else {
    const next = [...model.value] as [string, string, string, string]
    next[index] = value
    model.value = next
  }
}

function toggleLinked() {
  linked.value = !linked.value
  if (linked.value) {
    const first = model.value[0] || model.value[1] || model.value[2] || model.value[3] || ''
    model.value = [first, first, first, first]
  }
}

defineExpose({ linked, toggleLinked })
</script>

<template>
  <div>
    <UnitInputUi
      v-if="linked"
      :model-value="model[0] ?? ''"
      placeholder="0"
      :units="units"
      :allow-auto="allowAuto"
      @update:model-value="updateValue(0, $event)"
    />
    <div v-else class="grid grid-cols-2 gap-1.5">
      <div v-for="(label, i) in labels" :key="label" class="space-y-0.5">
        <LabelUi
          drag
          size="xs"
          class="block text-secondary"
          :model-value="model[i] ?? ''"
          @update:model-value="updateValue(i, $event)"
        >{{ label }}</LabelUi>
        <UnitInputUi
          :model-value="model[i] ?? ''"
          placeholder="0"
          :units="units"
          :allow-auto="allowAuto"
          @update:model-value="updateValue(i, $event)"
        />
      </div>
    </div>
  </div>
</template>
