<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

type Placement = 'top' | 'bottom' | 'left' | 'right'

const props = withDefaults(
  defineProps<{
    content?: string
    placement?: Placement
    delay?: number
    disabled?: boolean
  }>(),
  {
    content: '',
    placement: 'top',
    delay: 300,
    disabled: false,
  },
)

defineOptions({ inheritAttrs: false })

const enabled = computed(() => !props.disabled && !!props.content)

const anchor = ref<HTMLElement | null>(null)
const visible = ref(false)
const posStyle = ref<Record<string, string>>({})
let openTimer: ReturnType<typeof setTimeout> | null = null

const GAP = 6

function measure() {
  const el = anchor.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const s: Record<string, string> = { position: 'fixed' }
  switch (props.placement) {
    case 'bottom':
      s.left = `${r.left + r.width / 2}px`
      s.top = `${r.bottom + GAP}px`
      s.transform = 'translate(-50%, 0)'
      break
    case 'left':
      s.left = `${r.left - GAP}px`
      s.top = `${r.top + r.height / 2}px`
      s.transform = 'translate(-100%, -50%)'
      break
    case 'right':
      s.left = `${r.right + GAP}px`
      s.top = `${r.top + r.height / 2}px`
      s.transform = 'translate(0, -50%)'
      break
    default:
      s.left = `${r.left + r.width / 2}px`
      s.top = `${r.top - GAP}px`
      s.transform = 'translate(-50%, -100%)'
  }
  posStyle.value = s
}

function show() {
  if (!enabled.value || openTimer) return
  openTimer = setTimeout(async () => {
    openTimer = null
    visible.value = true
    await nextTick()
    measure()
  }, props.delay)
}
function hide() {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
  visible.value = false
}

function onReposition() {
  if (visible.value) measure()
}

watch(visible, (v) => {
  if (v) {
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
  } else {
    window.removeEventListener('scroll', onReposition, true)
    window.removeEventListener('resize', onReposition)
  }
})
watch(enabled, (v) => {
  if (!v) hide()
})
onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})
</script>

<template>
  <slot v-if="!enabled" />
  <template v-else>
    <span
      ref="anchor"
      class="inline-flex"
      v-bind="$attrs"
      @mouseenter="show"
      @mouseleave="hide"
      @focusin="show"
      @focusout="hide"
    >
      <slot />
    </span>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-100 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-75 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="visible" :style="posStyle" class="pointer-events-none z-[120]">
          <div
            role="tooltip"
            class="rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium leading-none whitespace-nowrap text-background shadow-lg"
          >
            {{ content }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
</template>
