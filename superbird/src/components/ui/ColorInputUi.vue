<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { GlobalTokensKey, type GlobalTokens } from '@/constants/injectionKeys'
import PopoverUi from './PopoverUi.vue'

const props = defineProps<{
  placeholder?: string
  tokens?: GlobalTokens
}>()

const model = defineModel<string>({ default: '' })

const injectedTokens = inject(GlobalTokensKey, undefined)
const swatchOpen = ref(false)

const paletteColors = computed(() =>
  Object.entries(props.tokens?.colors ?? injectedTokens?.value.colors ?? {}),
)

function pickPalette(name: string) {
  model.value = `var(--global-${name})`
  swatchOpen.value = false
}

function pickCustom(e: Event) {
  model.value = (e.target as HTMLInputElement).value
  swatchOpen.value = false
}
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
        :style="{ backgroundColor: model || 'transparent' }"
      />
    </button>

    <!-- Text input -->
    <input
      v-model="model"
      :placeholder="placeholder ?? '#000000'"
      class="h-full min-w-0 flex-1 bg-transparent pr-2.5 text-xs text-foreground placeholder:text-foreground/40 outline-none"
    />

    <PopoverUi v-model:open="swatchOpen" align="left" panel-class="p-2">
      <!-- Palette swatches -->
      <div class="grid grid-cols-4 gap-1 mb-2">
        <button
          v-for="[name, color] in paletteColors"
          :key="name"
          class="group flex flex-col items-center gap-0.5 rounded-lg p-1 cursor-pointer hover:bg-secondary/10 transition-colors duration-100"
          :title="name"
          @click="pickPalette(name)"
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
          :value="model.startsWith('var(') ? '#000000' : (model || '#000000')"
          class="size-7 shrink-0 cursor-pointer rounded-lg border border-foreground/15 bg-transparent p-0.5"
          @input="pickCustom"
        />
        <span class="text-[10px] text-secondary">Custom color</span>
      </div>
    </PopoverUi>
  </div>
</template>
