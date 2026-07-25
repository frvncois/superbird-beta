<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSetupStore } from '@/stores/setup'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import { timeAgo } from '@/lib/datetime'

const setup = useSetupStore()
const siteSettings = useSiteSettingsStore()

// Project provisioned at setup is the source of truth; fall back to site settings.
const name = computed(() => setup.project?.name ?? siteSettings.siteSettings.identity.title)

// Where the deployment actually lives: the URL configured in Settings › General,
// or the runtime origin when unset. Ensure a scheme so copy/open work.
const fullUrl = computed(() => {
  const configured = siteSettings.siteSettings.deployment.url.trim()
  const raw = configured || window.location.origin
  return /:\/\//.test(raw) ? raw : `https://${raw}`
})
// Shown without the scheme / trailing slash.
const displayUrl = computed(() => fullUrl.value.replace(/^https?:\/\//, '').replace(/\/$/, ''))

const isPublished = computed(() => setup.isPublished)
const lastPublished = computed(() =>
  setup.publishedAt ? `Last published ${timeAgo(setup.publishedAt)}` : 'Not published yet',
)

const copied = ref(false)
async function copyUrl() {
  try {
    await navigator.clipboard.writeText(fullUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>

<template>
  <CardUi size="sm" icon="globe" title="Project">
    <template #header-action>
      <BadgeUi v-if="isPublished" variant="success" size="xs" dot pulse>Published</BadgeUi>
      <BadgeUi v-else variant="default" size="xs" dot>Draft</BadgeUi>
    </template>

    <div class="flex flex-col">
      <p class="truncate text-sm font-medium text-foreground">{{ name }}</p>

      <!-- Copyable deployment URL with slide swap + quick actions -->
      <div class="flex items-center gap-0.5">
        <div class="relative h-5 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            class="absolute inset-0 flex cursor-pointer items-center transition-transform duration-300 ease-in-out"
            :style="{ transform: copied ? 'translateY(-100%)' : 'translateY(0)' }"
            :title="fullUrl"
            @click="copyUrl"
          >
            <span class="truncate text-xs text-foreground">{{ displayUrl }}</span>
          </button>
          <span
            class="absolute inset-0 flex items-center text-[10px] font-medium text-green-fg transition-transform duration-300 ease-in-out"
            :style="{ transform: copied ? 'translateY(0)' : 'translateY(100%)' }"
          >
            Link copied!
          </span>
        </div>
        <ButtonUi variant="ghost" size="sm" square icon="copy" title="Copy URL" @click="copyUrl" />
        <ButtonUi variant="ghost" size="sm" square icon="settings" title="Deployment settings" to="/settings?tab=general" />
        <!-- External link → real anchor (native new-tab / ⌘-click); ButtonUi has no external href. -->
        <a
          :href="fullUrl"
          target="_blank"
          rel="noopener"
          title="Open in new tab"
          class="flex size-7 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors duration-100 hover:bg-secondary/10 hover:text-foreground"
        >
          <IconUi name="external-link" size="size-3.5" />
        </a>
      </div>
      <p class="text-secondary text-[10px]">{{ lastPublished }}</p>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1" :to="'/editor'">Open editor</ButtonUi>

    </template>
  </CardUi>
</template>
