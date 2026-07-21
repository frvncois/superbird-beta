<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import ButtonUi from '@/components/ui/ButtonUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

function removeNode() {
  if (!node.value) return
  store.removeNode(node.value.id)
}
</script>

<template>
  <section v-if="node" class="pt-3">
    <ButtonUi variant="danger" size="sm" class="w-full" @click="removeNode">
      Delete element
    </ButtonUi>
  </section>
</template>
