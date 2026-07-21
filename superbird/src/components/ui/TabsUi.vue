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
    <div class="flex border-b">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'cursor-pointer px-3 py-2 text-xs transition-colors duration-[250ms]',
          activeTab === tab.key
            ? 'border-foreground text-foreground font-medium'
            : 'border-transparent text-secondary hover:text-foreground',
        ]"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="relative overflow-hidden">
      <Transition
        :name="direction === 'right' ? 'tab-slide-right' : 'tab-slide-left'"
        mode="out-in"
      >
        <div :key="activeTab">
          <slot :name="activeTab" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Slide right (forward) */
.tab-slide-right-enter-active {
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}
.tab-slide-right-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}
.tab-slide-right-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.tab-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* Slide left (backward) */
.tab-slide-left-enter-active {
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}
.tab-slide-left-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}
.tab-slide-left-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
.tab-slide-left-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
