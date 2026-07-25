<script setup lang="ts">
import { ref, computed } from 'vue'
import SizeTokenInputUi from './SizeTokenInputUi.vue'
import DragLabelUi from './DragLabelUi.vue'
import ButtonUi from './ButtonUi.vue'

withDefaults(
  defineProps<{
    labels?: [string, string, string, string]
    units?: string[]
    allowAuto?: boolean
  }>(),
  {
    labels: () => ['T', 'R', 'B', 'L'] as [string, string, string, string],
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
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="linked" class="flex items-center gap-1.5">
      <SizeTokenInputUi
        :model-value="model[0] ?? ''"
        placeholder="0"
        :units="units"
        :allow-auto="allowAuto"
        @update:model-value="updateValue(0, $event)"
      />
      <ButtonUi
        variant="ghost"
        size="sm"
        icon="link"
        title="Unlink sides"
        @click="toggleLinked"
      />
    </div>
    <template v-else>
      <div class="grid grid-cols-2 gap-1.5">
        <div v-for="(label, i) in labels" :key="label" class="space-y-0.5">
          <DragLabelUi
            class="block text-[9px] text-secondary/60"
            :model-value="model[i] ?? ''"
            @update:model-value="updateValue(i, $event)"
          >{{ label }}</DragLabelUi>
          <SizeTokenInputUi
            :model-value="model[i] ?? ''"
            placeholder="0"
            :units="units"
            :allow-auto="allowAuto"
            @update:model-value="updateValue(i, $event)"
          />
        </div>
      </div>
      <ButtonUi
        variant="ghost"
        size="sm"
        icon="link"
        title="Link sides"
        class="w-full !text-secondary"
        @click="toggleLinked"
      >
        Link
      </ButtonUi>
    </template>
  </div>
</template>
