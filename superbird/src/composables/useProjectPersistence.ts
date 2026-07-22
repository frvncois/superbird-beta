import { watch, nextTick } from 'vue'
import { apiGet, apiPut } from '@/lib/api'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useUserComponentsStore } from '@/stores/userComponents'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useLocalesStore } from '@/stores/locales'
import { useCollectionsStore } from '@/stores/collections'
import type { ProjectDocument } from '@shared/types'
import type {
  Page,
  StyleClass,
  GlobalStyles,
  UserComponent,
  SiteSettings,
  Collection,
  Entry,
  Locale,
} from '@/types/canvas'

// Whole-project persistence: the project (design + content) is one JSON
// document loaded on sign-in and autosaved (debounced) on any change. Media
// is not persisted here yet (files-on-disk pipeline is a later slice).

let watching = false
let suspend = false // true while hydrating, so we don't autosave the load
let timer: ReturnType<typeof setTimeout> | null = null

function buildSnapshot(): ProjectDocument {
  const canvas = useCanvasStore()
  const styles = useGlobalStylesStore()
  const components = useUserComponentsStore()
  const settings = useSiteSettingsStore()
  const locales = useLocalesStore()
  const collections = useCollectionsStore()
  return {
    design: {
      pages: canvas.pages,
      styleClasses: styles.styleClasses,
      globalStyles: styles.globalStyles,
      userComponents: components.userComponents,
      siteSettings: settings.siteSettings,
      locales: {
        locales: locales.locales,
        activeLocale: locales.activeLocale,
        defaultLocale: locales.defaultLocale,
      },
    },
    content: {
      collections: collections.collections,
      entries: collections.entries,
    },
  }
}

function applyDocument(doc: ProjectDocument): void {
  if (!doc.design) return
  const canvas = useCanvasStore()
  const styles = useGlobalStylesStore()
  const components = useUserComponentsStore()
  const settings = useSiteSettingsStore()
  const locales = useLocalesStore()
  const collections = useCollectionsStore()

  suspend = true
  styles.hydrate({
    globalStyles: doc.design.globalStyles as GlobalStyles,
    styleClasses: doc.design.styleClasses as Record<string, StyleClass>,
  })
  components.hydrate(doc.design.userComponents as Record<string, UserComponent>)
  settings.hydrate(doc.design.siteSettings as SiteSettings)
  locales.hydrate(doc.design.locales as { locales: Locale[]; activeLocale: string; defaultLocale: string })
  collections.hydrate({
    collections: doc.content.collections as Collection[],
    entries: doc.content.entries as Entry[],
  })
  // Pages last — sets the active page once styles/collections are in place.
  canvas.hydratePages(doc.design.pages as Page[])
  nextTick(() => {
    suspend = false
  })
}

async function save(): Promise<void> {
  await apiPut('/api/project', buildSnapshot())
}

function startAutosave(): void {
  if (watching) return
  watching = true
  watch(
    () => JSON.stringify(buildSnapshot()),
    () => {
      if (suspend) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void save(), 800)
    },
  )
}

export function useProjectPersistence() {
  // Load the project after sign-in. Fresh projects (design === null) persist
  // the current demo seed as their starting point.
  async function load(): Promise<void> {
    const doc = await apiGet<ProjectDocument>('/api/project')
    if (doc.design) applyDocument(doc)
    else await save()
    startAutosave()
  }

  return { load, save }
}
