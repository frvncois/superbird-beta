<script setup lang="ts">
import { ref } from 'vue'
import LabelUi from './LabelUi.vue'
import ButtonUi from './ButtonUi.vue'
import LinkedUnitInputUi from './LinkedUnitInputUi.vue'

withDefaults(
  defineProps<{
    title: string
    labels?: [string, string, string, string]
    units?: string[]
    allowAuto?: boolean
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
