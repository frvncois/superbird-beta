<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { deviceIcon, BREAKPOINT_PRESETS } from '@/constants/canvas'
import PopoverUi from '@/components/ui/PopoverUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import TooltipUi from '@/components/ui/TooltipUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'

const store = useGlobalStylesStore()
const isOpen = ref(false)
const showAdd = ref(false)

const sorted = computed(() => [...store.breakpoints].sort((a, b) => b.width - a.width))
const active = computed(() => store.breakpoints.find((b) => b.id === store.activeBreakpoint))
const canRemove = computed(() => store.breakpoints.length > 1)

const availablePresets = computed(() =>
  BREAKPOINT_PRESETS.filter((p) => !store.breakpoints.some((b) => b.width === p.width)),
)

const newName = ref('')
const newWidth = ref('')

function select(id: string) {
  store.setActiveBreakpoint(id)
  isOpen.value = false
}
function addPreset(p: { name: string; width: number }) {
  store.addBreakpoint(p.name, p.width)
  showAdd.value = false
  isOpen.value = false
}
function addCustom() {
  const w = parseInt(newWidth.value, 10)
  if (!w || w <= 0) return
  store.addBreakpoint(newName.value, w)
  newName.value = ''
  newWidth.value = ''
  showAdd.value = false
  isOpen.value = false
}

const pendingRemove = ref<string | null>(null)
const removeDescription = computed(() => {
  const bp = store.breakpoints.find((b) => b.id === pendingRemove.value)
  return bp
    ? `Remove the “${bp.name}” breakpoint (${bp.width}px)? Styles set only at this breakpoint will no longer apply.`
    : ''
})
function requestRemove(id: string) {
  pendingRemove.value = id
}
function doRemove() {
  if (pendingRemove.value) store.removeBreakpoint(pendingRemove.value)
  pendingRemove.value = null
}

watch(isOpen, (open) => {
  if (!open) showAdd.value = false
})
</script>

<template>
  <div class="relative">
    <TooltipUi content="Breakpoints" placement="bottom" :disabled="isOpen">
      <ButtonUi variant="outline" size="sm" :icon="deviceIcon(active?.width ?? 1280)" @click="isOpen = !isOpen">
        <span class="text-xs font-medium">{{ active?.name ?? 'Desktop' }}</span>
      </ButtonUi>
    </TooltipUi>

    <PopoverUi v-model:open="isOpen" align="right" panel-class="w-60 p-1.5 rounded-2xl">
      <div>
        <div class="space-y-0.5">
          <div v-for="bp in sorted" :key="bp.id" class="flex items-center gap-0.5">
            <ButtonUi
              variant="ghost"
              size="sm"
              align="start"
              class="min-w-0 flex-1"
              :active="bp.id === store.activeBreakpoint"
              :icon="deviceIcon(bp.width)"
              @click="select(bp.id)"
            >
              <span class="min-w-0 flex-1 truncate text-left">{{ bp.name }}</span>
              <span class="font-mono text-[10px] text-secondary/60">{{ bp.width }}px</span>
            </ButtonUi>
            <IconButtonUi
              v-if="canRemove"
              size="sm"
              variant="danger"
              title="Remove breakpoint"
              @click="requestRemove(bp.id)"
            >
              <IconUi name="close" size="size-2.5" />
            </IconButtonUi>
          </div>
        </div>

        <div class="my-1.5 border-t border-foreground/8" />

        <template v-if="showAdd">
          <div v-if="availablePresets.length" class="space-y-0.5">
            <ButtonUi
              v-for="p in availablePresets"
              :key="p.name"
              variant="ghost"
              size="sm"
              align="start"
              class="w-full"
              :icon="deviceIcon(p.width)"
              @click="addPreset(p)"
            >
              <span class="min-w-0 flex-1 truncate text-left">{{ p.name }}</span>
              <span class="font-mono text-[10px] text-secondary/60">{{ p.width }}px</span>
            </ButtonUi>
          </div>
          <div class="mt-1 flex items-center gap-1.5 px-1">
            <InputUi v-model="newName" size="xs" placeholder="Name" class="min-w-0 flex-1" />
            <InputUi v-model="newWidth" size="xs" type="number" placeholder="px" class="w-14" @keydown.enter="addCustom" />
            <ButtonUi size="sm" class="shrink-0" @click="addCustom">Add</ButtonUi>
          </div>
          <ButtonUi variant="ghost" size="sm" class="mt-1 w-full" @click="showAdd = false">Cancel</ButtonUi>
        </template>
        <ButtonUi
          v-else
          variant="ghost"
          size="sm"
          align="start"
          icon="plus"
          class="w-full"
          @click="showAdd = true"
        >
          Add breakpoint
        </ButtonUi>
      </div>
    </PopoverUi>

    <ConfirmDialogUi
      :open="!!pendingRemove"
      title="Remove breakpoint"
      :description="removeDescription"
      confirm-label="Remove"
      @update:open="pendingRemove = null"
      @confirm="doRemove"
    />
  </div>
</template>
