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

const { node, isTextNode, isCollectionList, isLinkable, boundField } = useNodeSettings()
</script>

<template>
  <EmptyStateUi v-if="!node" message="Select an element to edit" />
  <div v-else class="space-y-1.5">
      <ElementInfoBlock />
      <CollectionBlock v-if="isCollectionList" />
      <FieldInfoBlock v-if="boundField" :field="boundField" />
      <ContentBlock v-if="isTextNode && !boundField" />
      <VisibilityBlock />
      <AttributesBlock />
      <LinkBlock v-if="isLinkable" />
    </div>
</template>
