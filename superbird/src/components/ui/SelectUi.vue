<script setup lang="ts">
defineProps<{
  options: { value: string; label: string }[]
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <select
    v-model="model"
    class="h-8 w-full min-w-0 appearance-none rounded-xl border border-foreground/15 bg-transparent px-2.5 text-xs text-foreground focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10 cursor-pointer"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
