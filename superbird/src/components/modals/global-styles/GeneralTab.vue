<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import FieldRowUi from '@/components/ui/FieldRowUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

// Basic setup settings. Theme lives here (moved out of the header).
const theme = ref<'light' | 'dark'>('light')

onMounted(() => {
  theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
})

watch(theme, (v) => {
  document.documentElement.classList.toggle('dark', v === 'dark')
})
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="space-y-2">
      <LabelUi>Appearance</LabelUi>
      <FieldRowUi label="Theme" label-width="lg">
        <SegmentedControlUi
          v-model="theme"
          :options="[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]"
        />
      </FieldRowUi>
    </div>
  </div>
</template>
