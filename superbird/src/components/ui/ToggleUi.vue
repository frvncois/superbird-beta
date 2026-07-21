<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :class="[
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-150',
      model ? 'bg-foreground' : 'bg-foreground/20',
    ]"
    @click="model = !model"
  >
    <span
      :class="[
        'absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-150',
        model && 'translate-x-4',
      ]"
    />
  </button>
</template>
