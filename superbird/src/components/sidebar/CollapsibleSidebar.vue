<script setup lang="ts">
import { ref, watch } from 'vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

export interface SidebarTab {
  key: string
  label: string
  icon: string
}

const props = defineProps<{
  tabs: SidebarTab[]
  collapsed: boolean
  side: 'left' | 'right'
}>()

const emit = defineEmits<{
  toggle: []
}>()

const floatingTab = ref<string | null>(null)

watch(() => props.collapsed, (collapsed) => {
  if (!collapsed) floatingTab.value = null
})

function handleIconClick(key: string) {
  floatingTab.value = floatingTab.value === key ? null : key
}

function closeFloating() {
  floatingTab.value = null
}
</script>

<template>
  <div class="relative flex h-full">
    <!-- EXPANDED: normal content with border handle -->
    <template v-if="!collapsed">
      <div class="flex-1 overflow-y-auto" :data-sidebar-scroll="side">
        <slot />
      </div>
      <!-- Border handle to collapse -->
      <div
        v-if="side === 'right'"
        class="sidebar-handle group absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
        @dblclick="emit('toggle')"
      >
        <div class="absolute inset-y-0 -left-px w-0.5 bg-transparent group-hover:bg-primary/40 transition-colors duration-150" />
      </div>
      <div
        v-else
        class="sidebar-handle group absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
        @dblclick="emit('toggle')"
      >
        <div class="absolute inset-y-0 -right-px w-0.5 bg-transparent group-hover:bg-primary/40 transition-colors duration-150" />
      </div>
    </template>

    <!-- COLLAPSED: icon strip only -->
    <template v-else>
      <div class="flex w-full flex-col items-center pt-1">
        <ButtonUi
          v-for="tab in tabs"
          :key="tab.key"
          variant="ghost"
          square
          :active="floatingTab === tab.key"
          :icon="tab.icon"
          :title="tab.label"
          class="mx-0.5"
          @click="handleIconClick(tab.key)"
        />
      </div>

      <!-- Border handle to expand -->
      <div
        v-if="side === 'right'"
        class="sidebar-handle group absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
        @dblclick="emit('toggle')"
      >
        <div class="absolute inset-y-0 -left-px w-0.5 bg-transparent group-hover:bg-primary/40 transition-colors duration-150" />
      </div>
      <div
        v-else
        class="sidebar-handle group absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
        @dblclick="emit('toggle')"
      >
        <div class="absolute inset-y-0 -right-px w-0.5 bg-transparent group-hover:bg-primary/40 transition-colors duration-150" />
      </div>
    </template>
  </div>

  <!-- Floating panel (when collapsed and a tab is clicked) -->
  <Teleport to="body">
    <template v-if="collapsed && floatingTab">
      <div class="fixed inset-0 z-[80]" @click="closeFloating" />
      <div
        :data-sidebar-scroll="side"
        :class="[
          'fixed top-[4em] z-[81] w-[300px] bg-background border rounded-2xl shadow-xl overflow-y-auto',
          side === 'left' ? 'left-[4em] border-r' : 'right-[4em] border-l',
        ]"
      >
        <slot :name="floatingTab" />
      </div>
    </template>
  </Teleport>
</template>
