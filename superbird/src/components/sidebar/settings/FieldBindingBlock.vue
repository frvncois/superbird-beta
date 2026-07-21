<script setup lang="ts">
import { computed } from 'vue'
import { useNodeSettings } from './useNodeSettings'
import SelectUi from '@/components/ui/SelectUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const { store, node, isCollectionList, isInsideCollection, collectionFields, hasFields, boundField } = useNodeSettings()

// The two variants are mutually exclusive for a given node
const showCollectionBinding = computed(
  () => isInsideCollection.value && collectionFields.value.length > 0 && !isCollectionList.value,
)
const showDynamicBinding = computed(
  () => hasFields.value && !isInsideCollection.value && !isCollectionList.value,
)

// One chip markup, parameterized by color classes (amber = collection, purple = dynamic)
const chipColors = computed(() =>
  showCollectionBinding.value
    ? {
        container: 'bg-amber-bg/50',
        iconBox: 'bg-amber-bg',
        text: 'text-amber-fg',
        unbind: 'text-amber-fg/60 hover:text-amber-fg',
      }
    : {
        container: 'bg-purple-bg/50',
        iconBox: 'bg-purple-bg',
        text: 'text-purple-fg',
        unbind: 'text-purple-fg/60 hover:text-purple-fg',
      },
)

const fieldOptions = computed(() =>
  showCollectionBinding.value
    ? [
        { value: '', label: 'None (static)' },
        ...collectionFields.value.map((f) => ({ value: f.key, label: f.label })),
      ]
    : [
        { value: '', label: 'None (static content)' },
        ...store.activePageFields.map((f) => ({ value: f.key, label: f.label })),
      ],
)

function bindField(fieldKey: string) {
  if (!node.value) return
  if (fieldKey === '') {
    store.unbindDynamicField(node.value.id)
  } else {
    store.bindDynamicField(node.value.id, fieldKey)
  }
}
</script>

<template>
  <section v-if="node && (showCollectionBinding || showDynamicBinding)" class="space-y-2 pb-3">
    <LabelUi>{{ showCollectionBinding ? 'Collection Field' : 'Dynamic Field' }}</LabelUi>

    <div
      v-if="boundField"
      :class="['flex items-center gap-2 rounded-xl px-3 py-2', chipColors.container]"
    >
      <span :class="['flex size-5 shrink-0 items-center justify-center rounded-md', chipColors.iconBox]">
        <span v-if="showCollectionBinding" :class="['text-[10px]', chipColors.text]">&#8634;</span>
        <IconUi v-else name="link" size="size-3" :class="chipColors.text" />
      </span>
      <span :class="['flex-1 text-xs font-medium', chipColors.text]">{{ boundField.label }}</span>
      <button
        :class="['text-[10px] cursor-pointer transition-colors duration-100', chipColors.unbind]"
        @click="bindField('')"
      >
        Unbind
      </button>
    </div>

    <SelectUi
      v-else
      :model-value="showCollectionBinding ? (node.dynamicField ?? '') : ''"
      :options="fieldOptions"
      @update:model-value="bindField"
    />
  </section>
</template>
