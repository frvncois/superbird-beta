<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { BREAKPOINTS } from '@/constants/canvas'
import type { Breakpoint } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useGlobalStylesStore()
const siteStore = useSiteSettingsStore()
const activeTab = ref('site')

const tabs = [
  { key: 'site', label: 'Site' },
  { key: 'styles', label: 'Styles' },
  { key: 'seo', label: 'SEO' },
  { key: 'code', label: 'Code' },
  { key: 'redirects', label: 'Redirects' },
  { key: 'integrations', label: 'Integrations' },
]

// Colors
const newColorName = ref('')
const newColorValue = ref('#000000')
function addColor() {
  const name = newColorName.value.trim()
  if (!name) return
  store.addGlobalColor(name, newColorValue.value)
  newColorName.value = ''
  newColorValue.value = '#000000'
}

// Sizes
const newSizeName = ref('')
const newSizeValue = ref('')
function addSize() {
  const name = newSizeName.value.trim()
  if (!name || !newSizeValue.value) return
  store.addGlobalSize(name, newSizeValue.value)
  newSizeName.value = ''
  newSizeValue.value = ''
}

// Typography breakpoint
const typoBp = ref<Breakpoint>('desktop')
const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

// Redirects
const newRedirectFrom = ref('')
const newRedirectTo = ref('')
function addRedirect() {
  if (!newRedirectFrom.value.trim() || !newRedirectTo.value.trim()) return
  siteStore.addRedirect(newRedirectFrom.value.trim(), newRedirectTo.value.trim())
  newRedirectFrom.value = ''
  newRedirectTo.value = ''
}

// Custom fonts
const newFontName = ref('')
const newFontUrl = ref('')
function addFont() {
  if (!newFontName.value.trim() || !newFontUrl.value.trim()) return
  siteStore.addCustomFont(newFontName.value.trim(), newFontUrl.value.trim())
  newFontName.value = ''
  newFontUrl.value = ''
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="store.globalStylesPanelOpen" class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-foreground/20 backdrop-blur-sm" @click="store.closePanel()" />

        <div class="relative w-[420px] max-w-full h-full bg-background border-l overflow-hidden shadow-xl flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b px-4 py-3 shrink-0">
            <h2 class="text-sm font-semibold">Global Settings</h2>
            <button
              class="flex size-7 items-center justify-center rounded-lg cursor-pointer text-secondary hover:bg-secondary/10 hover:text-foreground transition-colors duration-150"
              @click="store.closePanel()"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b shrink-0 px-2 overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="[
                'px-3 py-2 text-xs -mb-px border-b-2 cursor-pointer transition-colors duration-150 whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent text-secondary hover:text-foreground',
              ]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">

            <!-- SITE TAB -->
            <div v-if="activeTab === 'site'" class="space-y-4">
              <PropertySectionUi title="Site Identity" icon="settings">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Title</span>
                    <InputUi :model-value="siteStore.siteSettings.identity.title" @update:model-value="siteStore.updateSiteIdentity({ title: $event })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Tagline</span>
                    <InputUi :model-value="siteStore.siteSettings.identity.tagline" @update:model-value="siteStore.updateSiteIdentity({ tagline: $event })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Favicon</span>
                    <InputUi :model-value="siteStore.siteSettings.identity.favicon ?? ''" placeholder="URL or upload" @update:model-value="siteStore.updateSiteIdentity({ favicon: $event || undefined })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Logo</span>
                    <InputUi :model-value="siteStore.siteSettings.identity.logo ?? ''" placeholder="URL or upload" @update:model-value="siteStore.updateSiteIdentity({ logo: $event || undefined })" />
                  </div>
                </div>
              </PropertySectionUi>
            </div>

            <!-- STYLES TAB -->
            <div v-if="activeTab === 'styles'">
              <!-- Colors -->
              <PropertySectionUi title="Color Palette" icon="background">
                <div class="space-y-2">
                  <div class="space-y-1">
                    <div v-for="(value, name) in store.globalStyles.colors" :key="name" class="flex items-center gap-2">
                      <input type="color" :value="value" class="size-7 shrink-0 cursor-pointer rounded-lg border border-foreground/15 bg-transparent p-0.5" @input="store.setGlobalColor(name as string, ($event.target as HTMLInputElement).value)" />
                      <span class="flex-1 text-xs font-mono">{{ name }}</span>
                      <span class="text-[10px] font-mono text-secondary">{{ value }}</span>
                      <button class="flex size-5 items-center justify-center rounded text-secondary/40 cursor-pointer hover:text-red-fg hover:bg-red-bg transition-colors duration-100" @click="store.removeGlobalColor(name as string)">
                        <svg class="size-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 pt-1">
                    <input type="color" v-model="newColorValue" class="size-7 shrink-0 cursor-pointer rounded-lg border border-foreground/15 bg-transparent p-0.5" />
                    <input v-model="newColorName" placeholder="Color name" class="h-7 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" @keydown.enter="addColor" />
                    <button class="h-7 rounded-lg bg-foreground px-2.5 text-[10px] font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150" @click="addColor">Add</button>
                  </div>
                </div>
              </PropertySectionUi>

              <!-- Fonts -->
              <PropertySectionUi title="Fonts" icon="typography">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Primary</span>
                    <InputUi :model-value="store.globalStyles.fonts.primary" placeholder="Inter" @update:model-value="store.setGlobalFont('primary', $event)" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Secondary</span>
                    <InputUi :model-value="store.globalStyles.fonts.secondary" placeholder="Playfair Display" @update:model-value="store.setGlobalFont('secondary', $event)" />
                  </div>
                </div>
              </PropertySectionUi>

              <!-- Sizes -->
              <PropertySectionUi title="Size Scale" icon="size">
                <div class="space-y-2">
                  <div class="space-y-1">
                    <div v-for="(value, name) in store.globalStyles.sizes" :key="name" class="flex items-center gap-2">
                      <span class="w-10 text-[10px] font-mono text-secondary">{{ name }}</span>
                      <InputUi :model-value="value" placeholder="16px" @update:model-value="store.setGlobalSize(name as string, $event)" />
                      <button class="flex size-5 shrink-0 items-center justify-center rounded text-secondary/40 cursor-pointer hover:text-red-fg hover:bg-red-bg transition-colors duration-100" @click="store.removeGlobalSize(name as string)">
                        <svg class="size-3" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 pt-1">
                    <input v-model="newSizeName" placeholder="name" class="h-7 w-16 shrink-0 rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" />
                    <input v-model="newSizeValue" placeholder="16px" class="h-7 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" @keydown.enter="addSize" />
                    <button class="h-7 rounded-lg bg-foreground px-2.5 text-[10px] font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150" @click="addSize">Add</button>
                  </div>
                </div>
              </PropertySectionUi>

              <!-- Typography -->
              <PropertySectionUi title="Typography" icon="typography">
                <div class="space-y-3">
                  <div class="flex gap-0.5 rounded-lg bg-foreground/5 p-0.5">
                    <button v-for="bp in BREAKPOINTS" :key="bp.key" :class="['flex-1 rounded-md px-2 py-1 text-[10px] font-medium cursor-pointer transition-all duration-150', typoBp === bp.key ? 'bg-background text-foreground shadow-sm' : 'text-secondary hover:text-foreground']" @click="typoBp = bp.key">{{ bp.label }}</button>
                  </div>
                  <div class="space-y-1.5">
                    <span class="text-[10px] font-mono text-secondary uppercase tracking-wider">Base</span>
                    <div class="grid grid-cols-2 gap-1.5">
                      <div class="space-y-0.5">
                        <span class="text-[9px] text-secondary">Font Size</span>
                        <UnitInputUi :model-value="store.globalStyles.typography[typoBp].baseFontSize" :units="['px', 'rem']" @update:model-value="store.updateTypography(typoBp, 'baseFontSize', $event)" />
                      </div>
                      <div class="space-y-0.5">
                        <span class="text-[9px] text-secondary">Line Height</span>
                        <InputUi :model-value="store.globalStyles.typography[typoBp].baseLineHeight" placeholder="1.5" @update:model-value="store.updateTypography(typoBp, 'baseLineHeight', $event)" />
                      </div>
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <span class="text-[10px] font-mono text-secondary uppercase tracking-wider">Headings</span>
                    <div v-for="tag in headingTags" :key="tag" class="flex items-center gap-1.5">
                      <span class="w-6 text-[10px] font-mono text-secondary uppercase">{{ tag }}</span>
                      <UnitInputUi :model-value="store.globalStyles.typography[typoBp].headings[tag].fontSize" :units="['px', 'rem', 'em']" placeholder="48" @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontSize: $event })" />
                      <SelectUi :model-value="store.globalStyles.typography[typoBp].headings[tag].fontWeight" :options="[{value:'400',label:'400'},{value:'500',label:'500'},{value:'600',label:'600'},{value:'700',label:'700'},{value:'800',label:'800'},{value:'900',label:'900'}]" @update:model-value="store.updateHeadingStyle(typoBp, tag, { fontWeight: $event })" />
                    </div>
                  </div>
                </div>
              </PropertySectionUi>
            </div>

            <!-- SEO TAB -->
            <div v-if="activeTab === 'seo'" class="space-y-4">
              <PropertySectionUi title="SEO Defaults" icon="settings">
                <div class="space-y-1.5">
                  <div class="space-y-1">
                    <span class="text-[10px] text-secondary">Title Format</span>
                    <InputUi :model-value="siteStore.siteSettings.seo.titleFormat" placeholder="%page_title% | %site_title%" @update:model-value="siteStore.updateSeo({ titleFormat: $event })" />
                    <span class="text-[9px] text-secondary/50">Use %page_title% and %site_title% as variables</span>
                  </div>
                  <div class="space-y-1">
                    <span class="text-[10px] text-secondary">Meta Description</span>
                    <textarea :value="siteStore.siteSettings.seo.metaDescription" placeholder="Default site description for search engines" rows="2" class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10" @input="siteStore.updateSeo({ metaDescription: ($event.target as HTMLTextAreaElement).value })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-20 text-[10px] text-secondary">Social Image</span>
                    <InputUi :model-value="siteStore.siteSettings.seo.socialImage ?? ''" placeholder="URL for OG image" @update:model-value="siteStore.updateSeo({ socialImage: $event || undefined })" />
                  </div>
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Robots" icon="settings" :default-open="false">
                <div class="space-y-1.5">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs">No Index (hide from search)</span>
                    <button :class="['relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer', siteStore.siteSettings.seo.robotsNoIndex ? 'bg-foreground' : 'bg-foreground/20']" @click="siteStore.updateSeo({ robotsNoIndex: !siteStore.siteSettings.seo.robotsNoIndex })">
                      <span :class="['absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200', siteStore.siteSettings.seo.robotsNoIndex && 'translate-x-4']" />
                    </button>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs">No Follow</span>
                    <button :class="['relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer', siteStore.siteSettings.seo.robotsNoFollow ? 'bg-foreground' : 'bg-foreground/20']" @click="siteStore.updateSeo({ robotsNoFollow: !siteStore.siteSettings.seo.robotsNoFollow })">
                      <span :class="['absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200', siteStore.siteSettings.seo.robotsNoFollow && 'translate-x-4']" />
                    </button>
                  </label>
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Analytics" icon="settings" :default-open="false">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-12 text-[10px] text-secondary">GA ID</span>
                    <InputUi :model-value="siteStore.siteSettings.seo.googleAnalyticsId ?? ''" placeholder="G-XXXXXXXXXX" @update:model-value="siteStore.updateSeo({ googleAnalyticsId: $event || undefined })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-12 text-[10px] text-secondary">GTM ID</span>
                    <InputUi :model-value="siteStore.siteSettings.seo.googleTagManagerId ?? ''" placeholder="GTM-XXXXXXX" @update:model-value="siteStore.updateSeo({ googleTagManagerId: $event || undefined })" />
                  </div>
                </div>
              </PropertySectionUi>
            </div>

            <!-- CODE TAB -->
            <div v-if="activeTab === 'code'" class="space-y-4">
              <PropertySectionUi title="Head Code" icon="settings">
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">Injected inside &lt;head&gt;</span>
                  <textarea :value="siteStore.siteSettings.customCode.headCode" placeholder="<!-- Analytics, fonts, meta tags -->" rows="4" class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[11px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10" @input="siteStore.updateCustomCode({ headCode: ($event.target as HTMLTextAreaElement).value })" />
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Body Start Code" icon="settings" :default-open="false">
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">Right after &lt;body&gt; open</span>
                  <textarea :value="siteStore.siteSettings.customCode.bodyStartCode" placeholder="<!-- GTM noscript, etc -->" rows="3" class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[11px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10" @input="siteStore.updateCustomCode({ bodyStartCode: ($event.target as HTMLTextAreaElement).value })" />
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Body End Code" icon="settings" :default-open="false">
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">Before &lt;/body&gt; close</span>
                  <textarea :value="siteStore.siteSettings.customCode.bodyEndCode" placeholder="<!-- Chat widgets, scripts -->" rows="3" class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[11px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10" @input="siteStore.updateCustomCode({ bodyEndCode: ($event.target as HTMLTextAreaElement).value })" />
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Custom CSS" icon="settings" :default-open="false">
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">Global CSS added to every page</span>
                  <textarea :value="siteStore.siteSettings.customCode.customCss" placeholder="/* Custom styles */" rows="6" class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[11px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10" @input="siteStore.updateCustomCode({ customCss: ($event.target as HTMLTextAreaElement).value })" />
                </div>
              </PropertySectionUi>
            </div>

            <!-- REDIRECTS TAB -->
            <div v-if="activeTab === 'redirects'" class="space-y-3">
              <div class="text-[10px] text-secondary">Manage 301/302 redirects for SEO migrations.</div>

              <!-- Existing redirects -->
              <div v-if="siteStore.siteSettings.redirects.length > 0" class="space-y-1">
                <div v-for="r in siteStore.siteSettings.redirects" :key="r.id" class="flex items-center gap-1.5 rounded-lg bg-secondary/5 px-2.5 py-1.5">
                  <span class="text-[10px] font-mono text-secondary shrink-0">{{ r.type }}</span>
                  <span class="text-[10px] font-mono truncate flex-1">{{ r.from }}</span>
                  <span class="text-[9px] text-secondary shrink-0">-></span>
                  <span class="text-[10px] font-mono truncate flex-1">{{ r.to }}</span>
                  <button class="flex size-4 shrink-0 items-center justify-center rounded text-secondary/40 cursor-pointer hover:text-red-fg transition-colors duration-100" @click="siteStore.removeRedirect(r.id)">
                    <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                  </button>
                </div>
              </div>
              <div v-else class="text-center py-6 text-xs text-secondary">No redirects configured</div>

              <!-- Add redirect -->
              <div class="space-y-1.5 border-t border-foreground/8 pt-3">
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">From path</span>
                  <input v-model="newRedirectFrom" placeholder="/old-page" class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" />
                </div>
                <div class="space-y-1">
                  <span class="text-[10px] text-secondary">To path</span>
                  <input v-model="newRedirectTo" placeholder="/new-page" class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-xs font-mono text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" @keydown.enter="addRedirect" />
                </div>
                <button class="h-8 w-full rounded-xl bg-foreground text-xs font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150" @click="addRedirect">Add Redirect</button>
              </div>
            </div>

            <!-- INTEGRATIONS TAB -->
            <div v-if="activeTab === 'integrations'" class="space-y-4">
              <PropertySectionUi title="Google Fonts" icon="typography">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">API Key</span>
                    <InputUi :model-value="siteStore.siteSettings.integrations.googleFontsApiKey ?? ''" placeholder="Optional" @update:model-value="siteStore.updateIntegrations({ googleFontsApiKey: $event || undefined })" />
                  </div>
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Custom Fonts" icon="typography">
                <div class="space-y-2">
                  <div v-if="siteStore.siteSettings.integrations.customFonts.length > 0" class="space-y-1">
                    <div v-for="(font, i) in siteStore.siteSettings.integrations.customFonts" :key="i" class="flex items-center gap-2 rounded-lg bg-secondary/5 px-2.5 py-1.5">
                      <span class="text-xs font-medium flex-1">{{ font.name }}</span>
                      <span class="text-[10px] text-secondary truncate max-w-24">{{ font.url }}</span>
                      <button class="flex size-4 shrink-0 items-center justify-center rounded text-secondary/40 cursor-pointer hover:text-red-fg transition-colors duration-100" @click="siteStore.removeCustomFont(i)">
                        <svg class="size-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <input v-model="newFontName" placeholder="Font name" class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" />
                    <div class="flex items-center gap-1.5">
                      <input v-model="newFontUrl" placeholder="WOFF2 URL" class="h-7 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-xs text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none" @keydown.enter="addFont" />
                      <button class="h-7 rounded-lg bg-foreground px-2.5 text-[10px] font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150" @click="addFont">Add</button>
                    </div>
                  </div>
                </div>
              </PropertySectionUi>

              <PropertySectionUi title="Forms" icon="settings" :default-open="false">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Handler</span>
                    <InputUi :model-value="siteStore.siteSettings.integrations.formHandler ?? ''" placeholder="Webhook URL" @update:model-value="siteStore.updateIntegrations({ formHandler: $event || undefined })" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-16 text-[10px] text-secondary">Email</span>
                    <InputUi :model-value="siteStore.siteSettings.integrations.formEmail ?? ''" placeholder="admin@site.com" @update:model-value="siteStore.updateIntegrations({ formEmail: $event || undefined })" />
                  </div>
                </div>
              </PropertySectionUi>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
