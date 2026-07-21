<script setup lang="ts">
import { useCanvasStore } from '@/stores/canvas'
import { BREAKPOINTS, type Breakpoint } from '@/types/canvas'

const store = useCanvasStore()
</script>

<template>
  <div class="flex items-center gap-0.5 rounded-xl bg-foreground/5 p-0.5">
    <button
      v-for="bp in BREAKPOINTS"
      :key="bp.key"
      :class="[
        'flex items-center gap-1 rounded-lg px-2 py-1 cursor-pointer transition-all duration-150',
        store.activeBreakpoint === bp.key
          ? 'bg-background text-foreground shadow-sm'
          : 'text-secondary hover:text-foreground',
      ]"
      :title="`${bp.label} (${bp.width}px)`"
      @click="store.setActiveBreakpoint(bp.key)"
    >
      <!-- Desktop -->
      <svg v-if="bp.icon === 'desktop'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5H3.5v-7.5Z" clip-rule="evenodd" />
      </svg>
      <!-- Tablet -->
      <svg v-else-if="bp.icon === 'tablet'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 1a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H5Zm0 1.5h10a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Zm4 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" clip-rule="evenodd" />
      </svg>
      <!-- Mobile -->
      <svg v-else-if="bp.icon === 'mobile'" class="size-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6Zm0 1.5h8a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Zm3 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" clip-rule="evenodd" />
      </svg>
      <span v-if="store.activeBreakpoint === bp.key" class="text-[10px] font-mono">{{ bp.width }}</span>
    </button>
  </div>
</template>
