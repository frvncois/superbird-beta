<script setup lang="ts">
import { ref } from 'vue'
import { STYLE_STATES } from '@/constants/canvas'
import type { StyleState } from '@/types/canvas'

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

function stateColor(state: StyleState): string {
  return STYLE_STATES.find((s) => s.key === state)?.color ?? '#a0a3a6'
}
</script>

<template>
  <div class="border-b border-foreground/8 last:border-b-0">
    <!-- Header -->
    <button
      class="flex w-full items-center gap-2 py-2.5 cursor-pointer group"
      @click="open = !open"
    >
      <!-- Icon -->
      <span class="flex size-4 shrink-0 items-center justify-center text-secondary">
        <!-- Layout -->
        <svg v-if="icon === 'layout'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h13A1.5 1.5 0 0 1 18 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 16.5v-13ZM3.5 3.5v13h5.25v-13H3.5Zm6.75 0v13h6.25v-13h-6.25Z" clip-rule="evenodd" />
        </svg>
        <!-- Position -->
        <svg v-else-if="icon === 'position'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.636a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM14.95 3.636a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.25 2.25a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Zm12.5 0a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5ZM5.05 14.95a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM10 15.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM14.95 14.95a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
        <!-- Size -->
        <svg v-else-if="icon === 'size'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V4.25A2.25 2.25 0 0 0 15.75 2H4.25ZM3.5 4.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75V4.25Z" clip-rule="evenodd" />
        </svg>
        <!-- Spacing -->
        <svg v-else-if="icon === 'spacing'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13ZM3.5 3.5h13v13h-13v-13Zm3 3h7v7h-7v-7Z" />
        </svg>
        <!-- Typography -->
        <svg v-else-if="icon === 'typography'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v4.5h6V4.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V10.5H5v5.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V4.25Z" clip-rule="evenodd" />
        </svg>
        <!-- Background -->
        <svg v-else-if="icon === 'background'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13Zm7.864 10.182a1.5 1.5 0 1 0-2.728-1.244l-2.04 4.472a.75.75 0 0 0 1.362.621l.478-1.049h3.128l.478 1.049a.75.75 0 0 0 1.362-.621l-2.04-4.228Z" clip-rule="evenodd" />
        </svg>
        <!-- Border -->
        <svg v-else-if="icon === 'border'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5v13A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-13ZM3.5 3.5h13v13h-13v-13Z" clip-rule="evenodd" />
        </svg>
        <!-- Effects -->
        <svg v-else-if="icon === 'effects'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 13.536a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM5.404 5.404a.75.75 0 0 0 0-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06a.75.75 0 0 0 1.06 0Z" />
        </svg>
        <!-- Fallback -->
        <svg v-else class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
        </svg>
      </span>

      <!-- Title -->
      <span class="text-[10px] font-medium text-foreground">{{ title }}</span>

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
      <svg
        :class="['size-3 text-secondary/40 transition-transform duration-150 ml-auto', !open && '-rotate-90']"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Content -->
    <div v-if="open" class="pb-3">
      <slot />
    </div>
  </div>
</template>
