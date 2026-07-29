<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { listBackups, createBackup, restoreBackup, deleteBackup, downloadExport, importBackup } from '@/lib/backupApi'
import { useToast } from '@/composables/useToast'
import { formatDateTime as fmtDate } from '@/lib/datetime'
import { formatFileSize as fmtSize } from '@/lib/media'
import type { BackupMeta } from '@shared/types'
import SettingsPanel from './SettingsPanel.vue'
import SettingsSection from './SettingsSection.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import ProcessDialogUi from '@/components/ui/ProcessDialogUi.vue'

const toast = useToast()

const backups = ref<BackupMeta[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const label = ref('')
const importInput = ref<HTMLInputElement | null>(null)

const pendingRestore = ref<BackupMeta | null>(null)
const pendingDelete = ref<BackupMeta | null>(null)
const pendingImport = ref<File | null>(null)

interface ProcState {
  open: boolean
  title: string
  message: string
  phase: 'busy' | 'success' | 'error'
  progress: { loaded: number; total: number } | null
  confirmLabel: string
}
const proc = reactive<ProcState>({
  open: false,
  title: '',
  message: '',
  phase: 'busy',
  progress: null,
  confirmLabel: 'Done',
})
const procPct = computed(() =>
  proc.progress && proc.progress.total ? Math.round((proc.progress.loaded / proc.progress.total) * 100) : 0,
)

function startProcess(opts: { title: string; message?: string; progress?: { loaded: number; total: number } }) {
  Object.assign(proc, {
    open: true,
    title: opts.title,
    message: opts.message ?? '',
    phase: 'busy',
    progress: opts.progress ?? null,
    confirmLabel: 'Done',
  })
  return {
    progress(loaded: number, total: number) {
      proc.progress = { loaded, total }
    },
    update(message: string) {
      proc.message = message
    },
    succeed(result?: { title?: string; message?: string }) {
      proc.phase = 'success'
      proc.progress = null
      if (result?.title) proc.title = result.title
      proc.message = result?.message ?? ''
      proc.confirmLabel = 'Done'
    },
    fail(message: string) {
      proc.phase = 'error'
      proc.progress = null
      proc.message = message
      proc.confirmLabel = 'Close'
    },
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    backups.value = (await listBackups()).backups
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load backups.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onCreate() {
  busy.value = true
  error.value = ''
  try {
    await createBackup(label.value || 'Manual backup')
    label.value = ''
    await load()
    toast.success('Backup created')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not create backup.')
  } finally {
    busy.value = false
  }
}

function onRestore(b: BackupMeta) {
  pendingRestore.value = b
}
async function doRestore() {
  const b = pendingRestore.value
  pendingRestore.value = null
  if (!b) return
  const p = startProcess({ title: 'Restoring backup', message: 'Replacing the current project…' })
  try {
    await restoreBackup(b.id)
    p.succeed({ title: 'Backup restored', message: 'Reloading the editor…' })
    location.reload()
  } catch (e) {
    p.fail(e instanceof Error ? e.message : 'Restore failed.')
  }
}

function onDelete(b: BackupMeta) {
  pendingDelete.value = b
}
async function doDelete() {
  const b = pendingDelete.value
  pendingDelete.value = null
  if (!b) return
  try {
    await deleteBackup(b.id)
    await load()
    toast.success('Backup deleted')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Delete failed.')
  }
}

async function onExport() {
  busy.value = true
  error.value = ''
  const p = startProcess({ title: 'Exporting site', message: 'Preparing your download…', progress: { loaded: 0, total: 0 } })
  try {
    await downloadExport((loaded, total) => p.progress(loaded, total))
    p.succeed({ title: 'Export ready', message: 'Your .sbbackup download has started.' })
  } catch (e) {
    p.fail(e instanceof Error ? e.message : 'Export failed.')
  } finally {
    busy.value = false
  }
}

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (importInput.value) importInput.value.value = ''
  if (!file) return
  pendingImport.value = file
}
async function doImport() {
  const file = pendingImport.value
  pendingImport.value = null
  if (!file) return
  busy.value = true
  error.value = ''
  const p = startProcess({ title: 'Importing site', message: 'Uploading…', progress: { loaded: 0, total: file.size } })
  try {
    await importBackup(file, (loaded, total) => {
      p.progress(loaded, total)
      if (loaded >= total) p.update('Applying import on the server…')
    })
    p.succeed({ title: 'Import complete', message: 'Reloading the editor…' })
    location.reload()
  } catch (e) {
    p.fail(e instanceof Error ? e.message : 'Import failed.')
    busy.value = false
  }
}
</script>

<template>
  <SettingsPanel title="Backup">
    <SettingsSection title="Backups" description="Point-in-time snapshots of your project. An automatic backup is kept daily; make one anytime.">
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="label" placeholder="Label (optional)" class="flex-1" @keydown.enter="onCreate" />
        <ButtonUi :disabled="busy" @click="onCreate">Back up now</ButtonUi>
      </div>

      <p v-if="error" class="px-4 py-2 text-xs text-red-fg">{{ error }}</p>
      <p v-if="loading" class="px-4 py-3 text-xs text-secondary">Loading…</p>
      <p v-else-if="!backups.length" class="px-4 py-3 text-xs text-secondary">No backups yet.</p>

      <div v-else class="divide-y">
        <div v-for="b in backups" :key="b.id" class="flex items-center gap-3 px-4 py-2.5">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm text-foreground">{{ b.label }}</span>
              <BadgeUi :variant="b.kind === 'auto' ? 'neutral' : 'primary'" size="xs" mono>{{ b.kind }}</BadgeUi>
            </div>
            <div class="text-xs text-secondary">{{ fmtDate(b.createdAt) }} · {{ fmtSize(b.size) }}</div>
          </div>
          <ButtonUi size="sm" variant="outline" :disabled="busy" @click="onRestore(b)">Restore</ButtonUi>
          <IconButtonUi size="sm" variant="danger" title="Delete backup" @click="onDelete(b)">
            <IconUi name="close" size="size-3" />
          </IconButtonUi>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Export / Import" description="Move your whole site (pages, content, media and fonts) between Superbird installs — like migrating a WordPress site.">
      <div class="flex flex-wrap items-center gap-3 px-4 py-3">
        <ButtonUi :disabled="busy" @click="onExport">
          <IconUi name="download" size="size-3.5" class="mr-1.5" /> Export site
        </ButtonUi>
        <input ref="importInput" type="file" accept=".sbbackup,application/json" class="hidden" @change="onImportFile" />
        <ButtonUi variant="outline" :disabled="busy" @click="importInput?.click()">
          <IconUi name="upload" size="size-3.5" class="mr-1.5" /> Import site
        </ButtonUi>
      </div>

      <p class="px-4 pb-3 text-xs leading-relaxed text-secondary">
        The export is a single <span class="font-mono text-foreground">.sbbackup</span> file, downloadable only by you.
        Importing <span class="font-medium text-foreground">replaces</span> the current project — a safety backup is taken first.
      </p>
    </SettingsSection>

    <ConfirmDialogUi
      :open="!!pendingRestore"
      title="Restore backup"
      :description="
        pendingRestore
          ? `Restore “${pendingRestore.label}” from ${fmtDate(pendingRestore.createdAt)}?\n\nThis replaces the current project. A safety backup is taken first, then the editor reloads.`
          : ''
      "
      confirm-label="Restore"
      @update:open="pendingRestore = null"
      @confirm="doRestore"
    />

    <ConfirmDialogUi
      :open="!!pendingDelete"
      title="Delete backup"
      :description="pendingDelete ? `Delete backup “${pendingDelete.label}”? This can't be undone.` : ''"
      confirm-label="Delete"
      @update:open="pendingDelete = null"
      @confirm="doDelete"
    />

    <ConfirmDialogUi
      :open="!!pendingImport"
      title="Import site"
      :description="
        pendingImport
          ? `Import “${pendingImport.name}”?\n\nThis REPLACES the current project (pages, content, media). A safety backup is taken first, then the editor reloads.`
          : ''
      "
      confirm-label="Import"
      @update:open="pendingImport = null"
      @confirm="doImport"
    />

    <ProcessDialogUi
      :open="proc.open"
      :phase="proc.phase"
      :title="proc.title"
      :message="proc.message"
      :confirm-label="proc.confirmLabel"
      @close="proc.open = false"
    >
      <template #default="{ busy }">
        <div v-if="busy && proc.progress">
          <div class="mb-1 flex items-center justify-between text-xs text-secondary">
            <span class="font-mono">
              {{ fmtSize(proc.progress.loaded) }}<template v-if="proc.progress.total"> / {{ fmtSize(proc.progress.total) }}</template>
            </span>
            <span v-if="proc.progress.total" class="font-mono">{{ procPct }}%</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-secondary/15">
            <div
              class="h-full rounded-full bg-primary transition-all duration-150"
              :class="!proc.progress.total && 'animate-pulse'"
              :style="{ width: proc.progress.total ? `${procPct}%` : '100%' }"
            />
          </div>
        </div>
      </template>
    </ProcessDialogUi>
    </SettingsPanel>
</template>
