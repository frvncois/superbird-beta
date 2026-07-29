import { ref, watch, nextTick } from 'vue'
import { apiGet, apiPut, apiPost } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import { useSetupStore } from '@/stores/setup'
import { useSnapshotsStore } from '@/stores/snapshots'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import { useUserComponentsStore } from '@/stores/userComponents'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useLocalesStore } from '@/stores/locales'
import { useCollectionsStore } from '@/stores/collections'
import type { ProjectDocument, PublishResult, SaveResult } from '@shared/types'
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
// bytes/metadata persist separately via the media store + /api/media.

let watching = false
let suspend = false // true while hydrating, so we don't autosave the load
let timer: ReturnType<typeof setTimeout> | null = null

// Save status for the header badge. Autosave IS the save (Figma/Webflow model):
// every edit persists after a short debounce and stamps draftSavedAt, so the
// badge reflects draft-vs-published, never a manual checkpoint. `changeSeq` lets
// a write settle to 'idle' only when no newer edit is still pending.
const saveState = ref<'idle' | 'saving'>('idle')
let changeSeq = 0

// Periodic "auto" version snapshot: after this many autosave bursts OR this much
// elapsed editing time (whichever first), snapshot the (already-saved) document.
// Dedup on the server means an unchanged document never creates a row.
const AUTO_SNAPSHOT_CHANGES = 20
const AUTO_SNAPSHOT_INTERVAL_MS = 10 * 60_000
let sinceLastAuto = 0
let lastAutoAt = Date.now()
function maybeAutoSnapshot(): void {
  sinceLastAuto++
  const now = Date.now()
  if (sinceLastAuto >= AUTO_SNAPSHOT_CHANGES || now - lastAutoAt >= AUTO_SNAPSHOT_INTERVAL_MS) {
    sinceLastAuto = 0
    lastAutoAt = now
    void useSnapshotsStore().create({ reason: 'auto' }).catch(() => {})
  }
}

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

// The one write path: persist the working document and advance draftSavedAt.
// Used by autosave (debounced on every edit), the first-run seed, publish (to
// flush before snapshotting), and manual snapshots. Cancels any pending debounce
// so we don't write twice, and settles the badge to 'idle' only when no newer
// edit arrived while the request was in flight. On failure the badge still
// settles (autosave surfaces a toast); markSaved runs only on success.
async function save(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null }
  const seq = changeSeq
  saveState.value = 'saving'
  try {
    const { savedAt } = await apiPut<SaveResult>('/api/project', buildSnapshot())
    useSetupStore().markSaved(savedAt)
  } finally {
    if (changeSeq === seq) saveState.value = 'idle'
  }
}

// Surface a failed autosave once, so silent data loss can't go unnoticed. We
// only warn again after a subsequent save succeeds.
let autosaveWarned = false
async function autosave(): Promise<void> {
  try {
    await save()
    autosaveWarned = false
    maybeAutoSnapshot()
  } catch {
    if (!autosaveWarned) {
      autosaveWarned = true
      useToast().error('Couldn’t save your changes. Check your connection — we’ll keep trying.', { duration: 0 })
    }
  }
}

function startAutosave(): void {
  if (watching) return
  watching = true
  const canvas = useCanvasStore()
  const styles = useGlobalStylesStore()
  const components = useUserComponentsStore()
  const settings = useSiteSettingsStore()
  const locales = useLocalesStore()
  const collections = useCollectionsStore()
  // Deep-watch each source ref rather than `() => JSON.stringify(buildSnapshot())`,
  // which serialized the entire multi-MB document synchronously on every reactive
  // flush. The single serialization now happens once inside the debounced save.
  watch(
    [
      () => canvas.pages,
      () => styles.styleClasses,
      () => styles.globalStyles,
      () => components.userComponents,
      () => settings.siteSettings,
      () => locales.locales,
      () => locales.activeLocale,
      () => locales.defaultLocale,
      () => collections.collections,
      () => collections.entries,
    ],
    () => {
      if (suspend) return
      changeSeq++
      saveState.value = 'saving'
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => void autosave(), 800)
    },
    { deep: true },
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

  // Publish: flush the latest working state, then snapshot the design as live.
  async function publish(): Promise<void> {
    await save()
    const { publishedAt } = await apiPost<PublishResult>('/api/publish')
    useSetupStore().markPublished(publishedAt)
    // Mark this published state in version history (best-effort; deduped).
    void useSnapshotsStore().create({ reason: 'publish' }).catch(() => {})
  }

  return { load, save, publish, saveState }
}
