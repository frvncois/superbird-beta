<script setup lang="ts">
import { computed, ref } from 'vue'
import LabelUi from './LabelUi.vue'
import IconUi from './IconUi.vue'

type InputSize = 'default' | 'sm' | 'xs'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    size?: InputSize
    type?: string
    label?: string
  }>(),
  {
    size: 'sm',
    type: 'text',
  },
)

const model = defineModel<string>({ default: '' })

const inputEl = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => inputEl.value?.focus() })

const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const resolvedType = computed(() => (isPassword.value ? (revealed.value ? 'text' : 'password') : props.type))

const sizeClasses: Record<InputSize, string> = {
  default: 'h-10 px-3 text-sm rounded-xl',
  sm: 'h-8 px-2.5 text-xs rounded-xl',
  xs: 'h-7 px-2 text-xs rounded-xl',
}

const inputClass = computed(() => [
  'w-full min-w-0 bg-input text-foreground placeholder:text-secondary/50 border border-input-border focus:border-input-border-focus outline-4 outline-transparent focus:outline-secondary/10',
  sizeClasses[props.size],
  isPassword.value ? 'pr-9' : '',
])
</script>

<template>
  <label v-if="label" class="flex flex-col gap-1.5">
    <LabelUi>{{ label }}</LabelUi>
    <span class="relative block">
      <input ref="inputEl" v-model="model" v-bind="$attrs" :type="resolvedType" :placeholder="placeholder" :class="inputClass" />
      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute inset-y-0 right-0 flex items-center px-2.5 text-secondary transition-colors hover:text-foreground"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        @click="revealed = !revealed"
      >
        <IconUi :name="revealed ? 'eye-slash' : 'eye'" size="size-4" />
      </button>
    </span>
  </label>

  <span v-else class="relative block">
    <input v-model="model" v-bind="$attrs" :type="resolvedType" :placeholder="placeholder" :class="inputClass" />
    <button
      v-if="isPassword"
      type="button"
      tabindex="-1"
      class="absolute inset-y-0 right-0 flex items-center px-2.5 text-secondary transition-colors hover:text-foreground"
      :aria-label="revealed ? 'Hide password' : 'Show password'"
      @click="revealed = !revealed"
    >
      <IconUi :name="revealed ? 'eye-slash' : 'eye'" size="size-4" />
    </button>
  </span>
</template>
