<script setup lang="ts">
import { ref, computed } from 'vue'
import SizeTokenInputUi from './SizeTokenInputUi.vue'

const props = withDefaults(
  defineProps<{
    values: [string, string, string, string]
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

const emit = defineEmits<{
  'update:values': [values: [string, string, string, string]]
}>()

const linked = ref(isAllSame())

function isAllSame(): boolean {
  const vals = props.values
  if (vals.every((v) => !v)) return true
  return vals[0] === vals[1] && vals[1] === vals[2] && vals[2] === vals[3]
}

function updateValue(index: number, value: string) {
  if (linked.value) {
    emit('update:values', [value, value, value, value])
  } else {
    const next = [...props.values] as [string, string, string, string]
    next[index] = value
    emit('update:values', next)
  }
}

function toggleLinked() {
  linked.value = !linked.value
  if (linked.value) {
    const first = props.values[0] || props.values[1] || props.values[2] || props.values[3] || ''
    emit('update:values', [first, first, first, first])
  }
}
</script>

<template>
  <div class="space-y-1.5">
    <div v-if="linked" class="flex items-center gap-1.5">
      <div class="flex-1">
        <SizeTokenInputUi
          :model-value="values[0] ?? ''"
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
        <svg class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
          <path d="M7.768 15.768a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 0 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3Z" />
        </svg>
      </button>
    </div>
    <template v-else>
      <div class="grid grid-cols-2 gap-1.5">
        <div v-for="(label, i) in labels" :key="label" class="space-y-0.5">
          <span class="text-[9px] text-secondary/60 font-mono">{{ label }}</span>
          <SizeTokenInputUi
            :model-value="values[i] ?? ''"
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
        <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
          <path d="M7.768 15.768a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 0 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3Z" />
        </svg>
        <span>Link</span>
      </button>
    </template>
  </div>
</template>
