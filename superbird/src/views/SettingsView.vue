<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import SettingsLayout from '@/layouts/SettingsLayout.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import GeneralPanel from '@/components/settings/GeneralPanel.vue'
import DesignPanel from '@/components/settings/DesignPanel.vue'
import TypographyPanel from '@/components/settings/TypographyPanel.vue'
import MediaPanel from '@/components/settings/MediaPanel.vue'
import SeoPanel from '@/components/settings/SeoPanel.vue'
import FormsPanel from '@/components/settings/FormsPanel.vue'
import StorePanel from '@/components/settings/StorePanel.vue'
import UsersPanel from '@/components/settings/UsersPanel.vue'
import SecurityPanel from '@/components/settings/SecurityPanel.vue'
import BackupPanel from '@/components/settings/BackupPanel.vue'
import AdvancedPanel from '@/components/settings/AdvancedPanel.vue'
import ThemeToggle from '@/components/settings/ThemeToggle.vue'

const categories = [
  { key: 'general', label: 'General', icon: 'settings', component: GeneralPanel },
  { key: 'design', label: 'Design', icon: 'background', component: DesignPanel },
  { key: 'typography', label: 'Typography', icon: 'typography', component: TypographyPanel },
  { key: 'media', label: 'Media', icon: 'image', component: MediaPanel },
  { key: 'seo', label: 'SEO', icon: 'search', component: SeoPanel },
  { key: 'forms', label: 'Forms', icon: 'form', component: FormsPanel },
  { key: 'store', label: 'Store', icon: 'store', component: StorePanel },
  { key: 'users', label: 'Users', icon: 'users', component: UsersPanel },
  { key: 'security', label: 'Security', icon: 'lock', component: SecurityPanel },
  { key: 'backup', label: 'Backup', icon: 'archive', component: BackupPanel },
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
</script>

<template>
  <AppShell>
    <SettingsLayout>
      <!-- Left nav -->
      <template #nav>
        <div class="flex-1 space-y-0.5 overflow-y-auto">
          <ButtonUi
            v-for="cat in categories"
            :key="cat.key"
            variant="ghost"
            align="start"
            :icon="cat.icon"
            class="w-full"
            :class="active === cat.key ? 'font-medium' : '!text-secondary hover:!text-foreground'"
            @click="active = cat.key"
          >
            {{ cat.label }}
          </ButtonUi>
        </div>

        <!-- Bottom: editor theme -->
        <ThemeToggle />
      </template>

      <!-- Content — each panel owns its own frame via SettingsPanel -->
      <component :is="activePanel" />
    </SettingsLayout>
  </AppShell>
</template>
