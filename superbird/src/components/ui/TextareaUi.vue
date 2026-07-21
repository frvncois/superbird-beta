<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string
    rows?: number
    mono?: boolean
  }>(),
  {
    rows: 3,
    mono: false,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <textarea
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    :class="[
      'w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10 transition-colors duration-150',
      mono && 'font-mono',
    ]"
  />
</template>
