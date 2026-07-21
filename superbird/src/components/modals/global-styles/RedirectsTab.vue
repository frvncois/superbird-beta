<script setup lang="ts">
import { ref } from 'vue'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

const siteStore = useSiteSettingsStore()

const newRedirectFrom = ref('')
const newRedirectTo = ref('')
function addRedirect() {
  if (!newRedirectFrom.value.trim() || !newRedirectTo.value.trim()) return
  siteStore.addRedirect(newRedirectFrom.value.trim(), newRedirectTo.value.trim())
  newRedirectFrom.value = ''
  newRedirectTo.value = ''
}
</script>

<template>
  <div class="space-y-3 p-4">
    <div class="text-[10px] text-secondary">Manage 301/302 redirects for SEO migrations.</div>

    <!-- Existing redirects -->
    <div v-if="siteStore.siteSettings.redirects.length > 0" class="space-y-1">
      <div
        v-for="r in siteStore.siteSettings.redirects"
        :key="r.id"
        class="flex items-center gap-1.5 rounded-lg bg-secondary/5 px-2.5 py-1.5"
      >
        <span class="text-[10px] font-mono text-secondary shrink-0">{{ r.type }}</span>
        <span class="text-[10px] font-mono truncate flex-1">{{ r.from }}</span>
        <span class="text-[9px] text-secondary shrink-0">-></span>
        <span class="text-[10px] font-mono truncate flex-1">{{ r.to }}</span>
        <IconButtonUi size="xs" variant="danger" title="Remove redirect" @click="siteStore.removeRedirect(r.id)">
          <IconUi name="close" size="size-2.5" />
        </IconButtonUi>
      </div>
    </div>
    <EmptyStateUi v-else compact message="No redirects configured" />

    <!-- Add redirect -->
    <div class="space-y-1.5 border-t border-foreground/8 pt-3">
      <div class="space-y-1">
        <LabelUi>From path</LabelUi>
        <InputUi v-model="newRedirectFrom" size="xs" placeholder="/old-page" class="font-mono" />
      </div>
      <div class="space-y-1">
        <LabelUi>To path</LabelUi>
        <InputUi
          v-model="newRedirectTo"
          size="xs"
          placeholder="/new-page"
          class="font-mono"
          @keydown.enter="addRedirect"
        />
      </div>
      <ButtonUi size="sm" class="w-full" @click="addRedirect">Add Redirect</ButtonUi>
    </div>
  </div>
</template>
