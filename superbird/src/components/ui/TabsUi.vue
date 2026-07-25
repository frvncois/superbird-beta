<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface Tab {
  key: string
  label: string
}

const props = defineProps<{
  tabs: Tab[]
}>()

const model = defineModel<string>()

const activeTab = computed({
  get: () => model.value ?? props.tabs[0]?.key ?? '',
  set: (value) => { model.value = value },
})

const direction = ref<'left' | 'right'>('right')
const previousIndex = ref(0)

watch(activeTab, (newKey) => {
  const newIndex = props.tabs.findIndex((t) => t.key === newKey)
  direction.value = newIndex >= previousIndex.value ? 'right' : 'left'
  previousIndex.value = newIndex
})

function selectTab(key: string) {
  activeTab.value = key
}
</script>

<template>
  <div>
    <!-- Tab bar -->
    <div class="flex items-center gap-1 border-b p-1.5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
          activeTab === tab.key
            ? 'bg-primary/10 text-primary'
            : 'bg-transparent text-secondary hover:bg-secondary/10 hover:text-foreground',
        ]"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="relative overflow-hidden">
      <!--
        Directional slide + fade. `transition` (v4 catch-all) is used because it
        covers `opacity` AND `translate` — `transition-[…,transform]` would miss
        the translate utilities, which animate the `translate` property in v4.
        Forward (right): new tab enters from the right, old leaves to the left.
      -->
      <Transition
        mode="out-in"
        enter-active-class="transition duration-[250ms] ease-out"
        leave-active-class="transition duration-200 ease-in"
        :enter-from-class="direction === 'right' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3'"
        :leave-to-class="direction === 'right' ? 'opacity-0 -translate-x-3' : 'opacity-0 translate-x-3'"
      >
        <div :key="activeTab">
          <slot :name="activeTab" />
        </div>
      </Transition>
    </div>
  </div>
</template>
