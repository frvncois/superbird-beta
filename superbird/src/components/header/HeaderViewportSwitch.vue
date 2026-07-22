<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint } from '@/types/canvas'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const store = useGlobalStylesStore()

const options = BREAKPOINTS.map((bp) => ({
  value: bp.key,
  title: `${bp.label} (${bp.width}px)`,
}))

const activeBreakpoint = computed({
  get: () => store.activeBreakpoint as string,
  set: (value) => store.setActiveBreakpoint(value as Breakpoint),
})

function breakpointWidth(key: string): number {
  return BREAKPOINTS.find((b) => b.key === key)?.width ?? 0
}
</script>

<template>
  <SegmentedControlUi v-model="activeBreakpoint" :options="options">
    <template #option="{ option, active }">
      <IconUi :name="option.value" size="size-4" />
      <span v-if="active" class="text-[10px] font-mono">{{ breakpointWidth(option.value) }}</span>
    </template>
  </SegmentedControlUi>
</template>
