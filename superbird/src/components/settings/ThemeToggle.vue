<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { isDark, setDark } from '@/lib/theme'
import IconUi from '@/components/ui/IconUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'

const dark = ref(false)
onMounted(() => {
  dark.value = isDark()
})
watch(dark, (v) => setDark(v))
</script>

<template>
  <div class="flex items-center justify-between gap-2 px-3 py-1.5">
    <span class="flex items-center gap-2.5 text-sm text-secondary">
      <IconUi :name="dark ? 'moon' : 'sun'" size="size-4" />
      Dark mode
    </span>
    <ToggleUi v-model="dark" />
  </div>
</template>
