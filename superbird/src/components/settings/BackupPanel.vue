<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listBackups, createBackup, restoreBackup, deleteBackup, downloadExport, importBackup } from '@/lib/backupApi'
import type { BackupMeta } from '@shared/types'
import SettingsSection from './SettingsSection.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'

const backups = ref<BackupMeta[]>([])
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const label = ref('')
const importInput = ref<HTMLInputElement | null>(null)

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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function onCreate() {
  busy.value = true
  error.value = ''
  try {
    await createBackup(label.value || 'Manual backup')
    label.value = ''
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create backup.'
  } finally {
    busy.value = false
  }
}

async function onRestore(b: BackupMeta) {
  if (!confirm(`Restore "${b.label}" from ${fmtDate(b.createdAt)}?\n\nThis replaces the current project. A safety backup is taken first. The editor will reload.`)) return
  busy.value = true
  try {
    await restoreBackup(b.id)
    location.reload()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Restore failed.'
    busy.value = false
  }
}

async function onDelete(b: BackupMeta) {
  if (!confirm(`Delete backup "${b.label}"?`)) return
  try {
    await deleteBackup(b.id)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Delete failed.'
  }
}

async function onExport() {
  busy.value = true
  error.value = ''
  try {
    await downloadExport()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Export failed.'
  } finally {
    busy.value = false
  }
}

async function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (importInput.value) importInput.value.value = ''
  if (!file) return
  if (!confirm(`Import "${file.name}"?\n\nThis REPLACES the current project (pages, content, media). A safety backup is taken first. The editor will reload.`)) return
  busy.value = true
  error.value = ''
  try {
    await importBackup(file)
    location.reload()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Import failed.'
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-10">
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
  </div>
</template>
