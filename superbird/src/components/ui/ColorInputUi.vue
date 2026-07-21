<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'

defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const store = useGlobalStylesStore()
const swatchOpen = ref(false)

const paletteColors = computed(() => Object.entries(store.globalStyles.colors))
</script>

<template>
  <div class="relative flex h-8 min-w-0 items-center rounded-xl border border-foreground/15 focus-within:border-foreground/40 outline-3 outline-transparent focus-within:outline-secondary/10 transition-colors duration-150">
    <!-- Color swatch button -->
    <button
      class="flex size-7 shrink-0 items-center justify-center cursor-pointer"
      @click.stop="swatchOpen = !swatchOpen"
    >
      <span
        class="size-4 rounded border border-foreground/15"
        :style="{ backgroundColor: modelValue || 'transparent' }"
      />
    </button>

    <!-- Text input -->
    <input
      :value="modelValue"
      :placeholder="placeholder ?? '#000000'"
      class="h-full min-w-0 flex-1 bg-transparent pr-2.5 text-xs text-foreground placeholder:text-foreground/40 outline-none"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <!-- Backdrop -->
    <div v-if="swatchOpen" class="fixed inset-0 z-40" @click="swatchOpen = false" />

    <!-- Swatch dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="swatchOpen"
        class="absolute left-0 top-full mt-1 z-50 rounded-xl border bg-background p-2 shadow-lg"
      >
        <!-- Palette swatches -->
        <div class="grid grid-cols-4 gap-1 mb-2">
          <button
            v-for="[name, color] in paletteColors"
            :key="name"
            class="group flex flex-col items-center gap-0.5 rounded-lg p-1 cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
            :title="name"
            @click="emit('update:modelValue', `var(--global-${name})`); swatchOpen = false"
          >
            <span
              class="size-6 rounded-md border border-foreground/10 group-hover:scale-110 transition-transform duration-100"
              :style="{ backgroundColor: color }"
            />
            <span class="text-[8px] font-mono text-secondary truncate max-w-full">{{ name }}</span>
          </button>
        </div>

        <!-- Native color picker -->
        <div class="flex items-center gap-1.5 border-t border-foreground/8 pt-2">
          <input
            type="color"
            :value="modelValue?.startsWith('var(') ? '#000000' : (modelValue || '#000000')"
            class="size-7 shrink-0 cursor-pointer rounded-lg border border-foreground/15 bg-transparent p-0.5"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value); swatchOpen = false"
          />
          <span class="text-[10px] text-secondary">Custom color</span>
        </div>
      </div>
    </Transition>
  </div>
</template>
