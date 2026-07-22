<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSetupStore } from '@/stores/setup'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const setup = useSetupStore()
const siteSettings = useSiteSettingsStore()

// Project provisioned at setup is the source of truth; fall back to site settings.
const name = computed(() => setup.project?.name ?? siteSettings.siteSettings.identity.title)
const handle = computed(
  () => setup.project?.handle ?? name.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
)
const url = computed(() => `${handle.value}.superbird.site`)
const isPublished = computed(() => setup.isPublished)

const copied = ref(false)
async function copyUrl() {
  try {
    await navigator.clipboard.writeText(`https://${url.value}`)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>

<template>
  <CardUi icon="globe" title="Project">
    <template #header-action>
      <BadgeUi v-if="isPublished" variant="success" size="xs" dot pulse>Published</BadgeUi>
      <BadgeUi v-else variant="default" size="xs" dot>Draft</BadgeUi>
    </template>

    <div class="flex flex-col gap-2">
      <p class="truncate text-sm font-medium text-foreground">{{ name }}</p>

      <!-- Copyable URL with slide swap -->
      <div class="flex items-center gap-1">
        <div class="relative h-5 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            class="absolute inset-0 flex cursor-pointer items-center transition-transform duration-300 ease-in-out"
            :style="{ transform: copied ? 'translateY(-100%)' : 'translateY(0)' }"
            @click="copyUrl"
          >
            <span class="truncate text-xs text-foreground">{{ url }}</span>
          </button>
          <span
            class="absolute inset-0 flex items-center text-[10px] font-medium text-green-fg transition-transform duration-300 ease-in-out"
            :style="{ transform: copied ? 'translateY(0)' : 'translateY(100%)' }"
          >
            Link copied!
          </span>
        </div>
        <button
          class="flex size-6 shrink-0 items-center justify-center rounded-md text-secondary transition-colors duration-100 hover:bg-background hover:text-foreground"
          title="Copy URL"
          @click="copyUrl"
        >
          <IconUi name="copy" size="size-3.5" />
        </button>
      </div>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1" :to="'/editor'">Open editor</ButtonUi>
      <a :href="`https://${url}`" target="_blank" rel="noopener noreferrer">
        <ButtonUi variant="ghost" size="sm" title="Visit site">
          <IconUi name="external-link" size="size-3.5" />
        </ButtonUi>
      </a>
    </template>
  </CardUi>
</template>
