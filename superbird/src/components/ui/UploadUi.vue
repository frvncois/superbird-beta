<script setup lang="ts">
import { computed } from 'vue'
import ButtonUi from './ButtonUi.vue'
import IconUi from './IconUi.vue'

withDefaults(
  defineProps<{
    name?: string
  }>(),
  {
    name: '',
  },
)

const emit = defineEmits<{
  (e: 'pick'): void
}>()

const model = defineModel<string>({ default: '' })

const hasImage = computed(() => !!model.value)

function clear() {
  model.value = ''
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="hasImage"
      class="flex flex-col items-stretch gap-2 rounded-xl border border-border bg-background p-1.5"
    >
      <button
        type="button"
        class="w-full aspect-square overflow-hidden rounded-lg border border-border bg-cover bg-center"
        :style="{ backgroundImage: `url(${model})` }"
        title="Replace image"
        @click="emit('pick')"
      />
      <ButtonUi variant="bare" size="sm" icon="close" title="Remove image" @click="clear" />
    </div>

    <button
      v-else
      type="button"
      class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-1.5 h-8 text-xs text-secondary transition-colors hover:border-foreground/30 hover:text-foreground"
      @click="emit('pick')"
    >
      <IconUi name="image" size="size-4" />
      Choose image
    </button>
  </div>
</template>
