<script setup lang="ts">
import { watch } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import SelectorSection from './SelectorSection.vue'
import LayoutSection from './LayoutSection.vue'
import PositionSection from './PositionSection.vue'
import SizeSection from './SizeSection.vue'
import SpacingSection from './SpacingSection.vue'
import TypographySection from './TypographySection.vue'
import BackgroundSection from './BackgroundSection.vue'
import BorderSection from './BorderSection.vue'
import EffectsSection from './EffectsSection.vue'
import { useNodeStyles } from './useNodeStyles'

const globalStylesStore = useGlobalStylesStore()
const { node, isContainer, isImage } = useNodeStyles()

watch(() => node.value?.id, () => {
  if (node.value && node.value.classes.length > 0) {
    globalStylesStore.setActiveClass(node.value.classes[0]!)
  } else {
    globalStylesStore.setActiveClass(null)
  }
  globalStylesStore.setActiveState('default')
})
</script>

<template>
  <EmptyStateUi v-if="!node" message="Select an element to edit" />

  <div v-else class="space-y-1.5">
    <SelectorSection />

    <LayoutSection v-if="isContainer" />
    <PositionSection />
    <SizeSection />
    <SpacingSection />
    <TypographySection />
    <BackgroundSection v-if="!isImage" />
    <BorderSection />
    <EffectsSection />
  </div>
</template>
