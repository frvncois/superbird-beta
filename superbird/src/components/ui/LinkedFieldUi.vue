<script setup lang="ts">
import { ref } from 'vue'
import LabelUi from './LabelUi.vue'
import ButtonUi from './ButtonUi.vue'
import LinkedUnitInputUi from './LinkedUnitInputUi.vue'

// Titled 4-side field: a group header (label + link/unlink toggle) above a
// LinkedUnitInputUi. Bundles the ref plumbing so callers write one line —
//   <LinkedFieldUi title="Padding" v-bind="linked([...])" />
// The toggle drives the input's linked state via its exposed `toggleLinked`.
withDefaults(
  defineProps<{
    title: string
    labels?: [string, string, string, string]
    units?: string[]
    allowAuto?: boolean
    // Noun in the link/unlink tooltip, e.g. "sides" (padding) or "corners" (radius).
    linkNoun?: string
  }>(),
  {
    allowAuto: false,
    linkNoun: 'sides',
  },
)

const model = defineModel<[string, string, string, string]>({
  default: () => ['', '', '', ''],
})

const input = ref<{ linked: boolean; toggleLinked: () => void } | null>(null)
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between">
      <LabelUi size="xs" class="text-secondary">{{ title }}</LabelUi>
      <ButtonUi
        variant="bare"
        size="sm"
        icon="link"
        :active="input?.linked"
        :title="(input?.linked ? 'Unlink ' : 'Link ') + linkNoun"
        @click="input?.toggleLinked()"
      />
    </div>
    <LinkedUnitInputUi
      ref="input"
      v-model="model"
      :labels="labels"
      :units="units"
      :allow-auto="allowAuto"
    />
  </div>
</template>
