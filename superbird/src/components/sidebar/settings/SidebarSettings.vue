<script setup lang="ts">
import { useNodeSettings } from './useNodeSettings'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import ElementInfoBlock from './ElementInfoBlock.vue'
import CollectionBlock from './CollectionBlock.vue'
import FieldInfoBlock from './FieldInfoBlock.vue'
import ContentBlock from './ContentBlock.vue'
import VisibilityBlock from './VisibilityBlock.vue'
import AttributesBlock from './AttributesBlock.vue'
import LinkBlock from './LinkBlock.vue'
import AccessibilityBlock from './AccessibilityBlock.vue'
import AdvancedBlock from './AdvancedBlock.vue'
import DeleteBlock from './DeleteBlock.vue'

const { node, isBody, isTextNode, isCollectionList, boundField } = useNodeSettings()
</script>

<template>
  <EmptyStateUi v-if="!node" message="Select an element to edit" />

  <div v-else class="p-3">
    <ElementInfoBlock />
    <CollectionBlock v-if="isCollectionList" />
    <FieldInfoBlock v-if="boundField" :field="boundField" />
    <ContentBlock v-if="isTextNode && !boundField" />

    <!-- Accordion sections -->
    <div class="border-t pt-1">
      <VisibilityBlock />
      <AttributesBlock />
      <LinkBlock />
      <AccessibilityBlock />
      <AdvancedBlock />
    </div>

    <DeleteBlock v-if="!isBody" />
  </div>
</template>
