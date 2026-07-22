<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { GlobalTokensKey } from '@/constants/injectionKeys'
import AppHeader from '@/components/header/AppHeader.vue'
import IconUi from '@/components/ui/IconUi.vue'
import GeneralPanel from '@/components/settings/GeneralPanel.vue'
import DesignPanel from '@/components/settings/DesignPanel.vue'
import TypographyPanel from '@/components/settings/TypographyPanel.vue'
import MediaPanel from '@/components/settings/MediaPanel.vue'
import SeoPanel from '@/components/settings/SeoPanel.vue'
import UsersPanel from '@/components/settings/UsersPanel.vue'
import IntegrationPanel from '@/components/settings/IntegrationPanel.vue'
import AdvancedPanel from '@/components/settings/AdvancedPanel.vue'

// Design tokens for UI primitives (ColorInputUi / SizeTokenInputUi swatches).
const globalStylesStore = useGlobalStylesStore()
provide(GlobalTokensKey, computed(() => ({
  colors: globalStylesStore.globalStyles.colors,
  sizes: globalStylesStore.globalStyles.sizes,
})))

const categories = [
  { key: 'general', label: 'General', icon: 'settings', component: GeneralPanel },
  { key: 'design', label: 'Design', icon: 'background', component: DesignPanel },
  { key: 'typography', label: 'Typography', icon: 'typography', component: TypographyPanel },
  { key: 'media', label: 'Media', icon: 'image', component: MediaPanel },
  { key: 'seo', label: 'SEO', icon: 'search', component: SeoPanel },
  { key: 'users', label: 'Users', icon: 'users', component: UsersPanel },
  { key: 'integration', label: 'Integration', icon: 'sparkles', component: IntegrationPanel },
  { key: 'advanced', label: 'Advanced', icon: 'embed', component: AdvancedPanel },
] as const

type CatKey = (typeof categories)[number]['key']
const route = useRoute()
// Deep-link support: /settings?tab=typography (e.g. from "Manage font family").
const initialTab = categories.some((c) => c.key === route.query.tab)
  ? (route.query.tab as CatKey)
  : 'general'
const active = ref<CatKey>(initialTab)
const activePanel = computed(() => categories.find((c) => c.key === active.value)?.component ?? GeneralPanel)
const activeLabel = computed(() => categories.find((c) => c.key === active.value)?.label ?? '')
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <AppHeader mode="settings" />
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- Left nav -->
      <nav class="w-56 shrink-0 space-y-0.5 overflow-y-auto border-r p-3">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="[
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-100',
            active === cat.key
              ? 'bg-foreground/5 font-medium text-foreground'
              : 'text-secondary hover:bg-foreground/5 hover:text-foreground',
          ]"
          @click="active = cat.key"
        >
          <IconUi :name="cat.icon" size="size-4" :class="active === cat.key ? 'text-foreground' : 'text-secondary'" />
          {{ cat.label }}
        </button>
      </nav>

      <!-- Content -->
      <main class="min-w-0 flex-1 overflow-y-auto">
        <div class="mx-auto max-w-2xl px-8 py-8">
          <h1 class="mb-6 text-lg font-semibold text-foreground">{{ activeLabel }}</h1>
          <component :is="activePanel" />
        </div>
      </main>
    </div>
  </div>
</template>
