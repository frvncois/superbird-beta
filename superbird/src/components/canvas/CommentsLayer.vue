<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useCommentsStore } from '@/stores/comments'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import type { CommentAnchor } from '@shared/types'
import CommentPin from './CommentPin.vue'

const store = useCommentsStore()
const canvas = useCanvasStore()
const globalStyles = useGlobalStylesStore()

const DRAFT = '__draft__'

const positions = ref<Record<string, { x: number; y: number }>>({})
const draft = ref<{ anchor: CommentAnchor } | null>(null)
const openId = ref<string | null>(null)
const focusedId = ref<string | null>(null)
const revealResolvedId = ref<string | null>(null)
let focusTimer: ReturnType<typeof setTimeout> | null = null

const candidates = computed(() => {
  const pid = canvas.activePageId
  const open = store.items.filter((c) => c.pageId === pid && !c.resolved)
  const revealed = store.items.find((c) => c.id === revealResolvedId.value && c.pageId === pid && c.resolved)
  return revealed ? [...open, revealed] : open
})

const pins = computed(() =>
  candidates.value
    .map((comment) => {
      const p = positions.value[comment.id]
      return p ? { comment, x: p.x, y: p.y } : null
    })
    .filter((p): p is { comment: (typeof candidates.value)[number]; x: number; y: number } => p !== null),
)

const draftPos = computed(() => positions.value[DRAFT] ?? null)

function reposition() {
  const artboard = document.querySelector('.canvas-artboard')
  if (!artboard) return
  const ar = artboard.getBoundingClientRect()
  const next: Record<string, { x: number; y: number }> = {}
  const place = (key: string, anchor: CommentAnchor) => {
    const el = artboard.querySelector(`[data-node-id="${CSS.escape(anchor.nodeId)}"]`)
    if (!el) return
    const nr = el.getBoundingClientRect()
    next[key] = { x: nr.left - ar.left + anchor.nx * nr.width, y: nr.top - ar.top + anchor.ny * nr.height }
  }
  for (const c of candidates.value) place(c.id, c.anchor)
  if (draft.value) place(DRAFT, draft.value.anchor)
  positions.value = next
}

let raf = 0
function scheduleReposition() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    reposition()
  })
}

function startDraft(anchor: CommentAnchor) {
  draft.value = { anchor }
  openId.value = null
  nextTick(scheduleReposition)
}
defineExpose({ startDraft })

async function onDraftSubmit(body: string) {
  const anchor = draft.value?.anchor
  if (!anchor) return
  await store.create({ pageId: canvas.activePageId, anchor, body })
  draft.value = null
}

function setOpen(id: string, v: boolean) {
  openId.value = v ? id : null
}

watch(openId, (id) => {
  if (revealResolvedId.value && id !== revealResolvedId.value) revealResolvedId.value = null
})

watch(
  () => store.focusRequest,
  (req) => {
    if (!req) return
    const c = store.items.find((x) => x.id === req.id)
    store.clearFocus()
    if (!c) return
    if (canvas.activePageId !== c.pageId) canvas.setActivePage(c.pageId)
    nextTick(() => {
      if (c.resolved) revealResolvedId.value = c.id
      openId.value = c.id
      focusedId.value = c.id
      if (focusTimer) clearTimeout(focusTimer)
      focusTimer = setTimeout(() => (focusedId.value = null), 2500)
      scheduleReposition()
      const el = document.querySelector(`.canvas-artboard [data-node-id="${CSS.escape(c.anchor.nodeId)}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(scheduleReposition, 350)
    })
  },
)

watch(() => store.items, scheduleReposition, { deep: true })
watch(
  () => [canvas.activePageId, globalStyles.activeViewportWidth],
  () => {
    openId.value = null
    draft.value = null
    revealResolvedId.value = null
    nextTick(scheduleReposition)
  },
)

let ro: ResizeObserver | null = null
let mo: MutationObserver | null = null
onMounted(() => {
  const artboard = document.querySelector('.canvas-artboard')
  if (artboard) {
    ro = new ResizeObserver(scheduleReposition)
    ro.observe(artboard)
    mo = new MutationObserver(scheduleReposition)
    mo.observe(artboard, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })
  }
  window.addEventListener('resize', scheduleReposition)
  nextTick(scheduleReposition)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  mo?.disconnect()
  window.removeEventListener('resize', scheduleReposition)
  if (raf) cancelAnimationFrame(raf)
  if (focusTimer) clearTimeout(focusTimer)
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-30">
    <CommentPin
      v-for="p in pins"
      :key="p.comment.id"
      :x="p.x"
      :y="p.y"
      :comment="p.comment"
      :focused="focusedId === p.comment.id"
      :open="openId === p.comment.id"
      @update:open="setOpen(p.comment.id, $event)"
    />
    <CommentPin
      v-if="draft && draftPos"
      :x="draftPos.x"
      :y="draftPos.y"
      :comment="null"
      :open="true"
      @submit="onDraftSubmit"
      @cancel="draft = null"
    />
  </div>
</template>
