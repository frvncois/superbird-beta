<script setup lang="ts">
import { ref, computed } from 'vue'
import SizeTokenInputUi from './SizeTokenInputUi.vue'
import IconUi from './IconUi.vue'

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
      <div class="flex-1">
        <SizeTokenInputUi
          :model-value="model[0] ?? ''"
          placeholder="0"
          :units="units"
          :allow-auto="allowAuto"
          @update:model-value="updateValue(0, $event)"
        />
      </div>
      <button
        class="flex size-8 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-colors duration-100"
        :class="linked ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-secondary hover:bg-secondary/10'"
        title="Unlink sides"
        @click="toggleLinked"
      >
        <IconUi name="link" size="size-3.5" />
      </button>
    </div>
    <template v-else>
      <div class="grid grid-cols-2 gap-1.5">
        <div v-for="(label, i) in labels" :key="label" class="space-y-0.5">
          <span class="text-[9px] text-secondary/60 font-mono">{{ label }}</span>
          <SizeTokenInputUi
            :model-value="model[i] ?? ''"
            placeholder="0"
            :units="units"
            :allow-auto="allowAuto"
            @update:model-value="updateValue(i, $event)"
          />
        </div>
      </div>
      <button
        class="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] cursor-pointer transition-colors duration-100"
        :class="'text-secondary hover:bg-secondary/10'"
        title="Link sides"
        @click="toggleLinked"
      >
        <IconUi name="link" size="size-3" />
        <span>Link</span>
      </button>
    </template>
  </div>
</template>
