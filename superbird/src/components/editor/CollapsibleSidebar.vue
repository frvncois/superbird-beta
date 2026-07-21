<script setup lang="ts">
import { ref, watch } from 'vue'

export interface SidebarTab {
  key: string
  label: string
  icon: string
}

const props = defineProps<{
  tabs: SidebarTab[]
  modelValue: string
  collapsed: boolean
  side: 'left' | 'right'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
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
      <div class="flex-1 overflow-y-auto">
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
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex size-10 items-center justify-center rounded-lg mx-0.5 cursor-pointer transition-colors duration-100',
            floatingTab === tab.key
              ? 'text-foreground bg-primary/10'
              : 'text-secondary hover:text-foreground hover:bg-secondary/8',
          ]"
          :title="tab.label"
          @click="handleIconClick(tab.key)"
        >
          <!-- Layers -->
          <svg v-if="tab.icon === 'layers'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M1 2.75A.75.75 0 0 1 1.75 2h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75ZM1 7.75A.75.75 0 0 1 1.75 7h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H1.75ZM1 17.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1-.75-.75Z" />
          </svg>
          <!-- Elements -->
          <svg v-else-if="tab.icon === 'elements'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          <!-- Components -->
          <svg v-else-if="tab.icon === 'components'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" />
          </svg>
          <!-- Properties -->
          <svg v-else-if="tab.icon === 'properties'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M.99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.51Zm8.26 9.52v-3.5l-2.25.01a.75.75 0 0 1 0-1.5l2.25-.01v-3.5a.75.75 0 0 1 1.5 0v3.5l2.25-.01a.75.75 0 0 1 0 1.5l-2.25.01v3.5a.75.75 0 0 1-1.5 0Z" clip-rule="evenodd" />
          </svg>
          <!-- Settings -->
          <svg v-else-if="tab.icon === 'settings'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
          </svg>
          <!-- Interactions -->
          <svg v-else-if="tab.icon === 'interactions'" class="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
          </svg>
        </button>
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
