<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import SelectorSection from './SelectorSection.vue'
import TailwindInfoPanel from './TailwindInfoPanel.vue'
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
const siteSettings = useSiteSettingsStore()
const { node, activeStyles, isContainer, isTextNode } = useNodeStyles()

const isTailwind = computed(() => siteSettings.siteSettings.cssMode === 'tailwind')

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
  <!-- No selection -->
  <EmptyStateUi v-if="!node" message="Select an element to edit" />

  <!-- Properties panel -->
  <div v-else>
    <SelectorSection />

    <!-- Tailwind mode: no property editing — show the parsed classes instead. -->
    <TailwindInfoPanel v-if="isTailwind" />

    <!-- Custom mode: the style sections. -->
    <template v-else-if="activeStyles">
      <div class="border-y">
        <LayoutSection v-if="isContainer" />
        <PositionSection />
        <SizeSection />
        <SpacingSection />
        <TypographySection v-if="isTextNode" />
        <BackgroundSection />
        <BorderSection />
        <EffectsSection />
      </div>
    </template>
  </div>
</template>
