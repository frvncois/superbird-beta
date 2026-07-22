<script setup lang="ts">
import { ref, computed } from 'vue'
import { STYLE_STATES } from '@/constants/canvas'
import type { StyleState } from '@/types/canvas'
import IconUi from '@/components/ui/IconUi.vue'

// Icons this section header supports; anything else falls back to the settings gear
const SECTION_ICONS = new Set([
  'layout',
  'position',
  'size',
  'spacing',
  'typography',
  'background',
  'border',
  'effects',
])

const props = withDefaults(
  defineProps<{
    title: string
    icon?: string
    statesWithValues?: StyleState[]
    defaultOpen?: boolean
  }>(),
  {
    statesWithValues: () => [],
    defaultOpen: true,
  },
)

const open = ref(props.defaultOpen)

const iconName = computed(() =>
  props.icon && SECTION_ICONS.has(props.icon) ? props.icon : 'settings',
)

function stateColor(state: StyleState): string {
  return STYLE_STATES.find((s) => s.key === state)?.color ?? '#a0a3a6'
}
</script>

<template>
  <div class="border-b border-foreground/8 last:border-b-0 py-1 px-3">
    <!-- Header -->
    <button
      class="flex w-full items-center gap-2 py-2.5 cursor-pointer group"
      @click="open = !open"
    >
      <!-- Icon -->
      <span class="flex size-4 shrink-0 items-center justify-center text-secondary">
        <IconUi :name="iconName" size="size-3.5" />
      </span>

      <!-- Title -->
      <span class="text-xs font-medium text-foreground">{{ title }}</span>

      <!-- State dots -->
      <div v-if="statesWithValues.length > 0" class="flex items-center gap-0.5 ml-auto mr-1">
        <span
          v-for="state in statesWithValues"
          :key="state"
          class="size-1.5 rounded-full"
          :style="{ backgroundColor: stateColor(state) }"
          :title="state"
        />
      </div>

      <!-- Chevron -->
      <IconUi
        name="chevron-down"
        size="size-3"
        :class="['text-secondary/40 transition-transform duration-150 ml-auto', !open && '-rotate-90']"
      />
    </button>

    <!-- Content -->
    <div v-if="open" class="pb-3">
      <slot />
    </div>
  </div>
</template>
