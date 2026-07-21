<script setup lang="ts">
defineProps<{
  modelValue?: string
  options: { value: string; label: string }[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <select
    :value="modelValue"
    class="h-8 w-full min-w-0 appearance-none rounded-xl border border-foreground/15 bg-transparent px-2.5 text-xs text-foreground focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10 cursor-pointer"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
