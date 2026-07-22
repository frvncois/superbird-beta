<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { parseTwClass } from '@/lib/tailwind'
import SelectUi from '@/components/ui/SelectUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const parsed = computed(() => (node.value?.classes ?? []).map((c) => parseTwClass(c)))

// Options for a class family, labeled by their readable value.
function optionsFor(options: string[]) {
  return options.map((o) => ({ value: o, label: parseTwClass(o).value }))
}

function change(oldCls: string, newCls: string) {
  if (!node.value || newCls === oldCls) return
  store.replaceClassOnNode(node.value.id, oldCls, newCls)
}
function remove(cls: string) {
  if (node.value) store.removeClassFromNode(node.value.id, cls)
}
</script>

<template>
  <div class="p-4">
    <div v-if="parsed.length" class="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
      <div v-for="p in parsed" :key="p.cls" class="flex items-center gap-2 px-3 py-2">
        <span class="w-24 shrink-0 truncate text-[11px] text-secondary">{{ p.label }}</span>
        <div class="min-w-0 flex-1">
          <SelectUi
            v-if="p.recognized && p.options.length"
            :model-value="p.cls"
            :options="optionsFor(p.options)"
            @update:model-value="(v: string) => change(p.cls, v)"
          />
          <span v-else class="block truncate font-mono text-xs text-foreground">{{ p.value }}</span>
        </div>
        <IconButtonUi size="sm" variant="danger" title="Remove class" @click="remove(p.cls)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
    </div>

    <EmptyStateUi v-else compact message="Add Tailwind classes above" />

    <p class="mt-2 text-[11px] leading-relaxed text-secondary">
      In Tailwind mode, styling is driven by the classes above. Click a value to swap it for
      another utility. Accurate rendering shows in Preview.
    </p>
  </div>
</template>
