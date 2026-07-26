<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSubmissionsStore, type Submission } from '@/stores/submissions'
import { useToast } from '@/composables/useToast'
import { downloadSubmissions } from '@/lib/submissionsExport'
import InputUi from '@/components/ui/InputUi.vue'
import DropdownUi from '@/components/ui/DropdownUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import LabelUi from '@/components/ui/LabelUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ConfirmDialogUi from '@/components/ui/ConfirmDialogUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

// `embedded` hides the internal title (the dashboard panel supplies its own).
defineProps<{ embedded?: boolean }>()

const store = useSubmissionsStore()
const toast = useToast()

const search = ref('')
const formId = ref('')
const status = ref('')
const from = ref('')
const to = ref('')
const expandedId = ref<string | null>(null)

const formOptions = computed(() => [
  { value: '', label: 'All forms' },
  ...store.forms.map((f) => ({ value: f.formId, label: `${f.formName} · ${f.count}` })),
])
const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'unread', label: 'Unread' },
  { value: 'sent', label: 'Sent' },
  { value: 'seen', label: 'Seen' },
]

let timer: ReturnType<typeof setTimeout> | null = null
function runLoad() {
  store.load({
    formId: formId.value || undefined,
    status: (status.value || undefined) as 'unread' | 'sent' | 'seen' | undefined,
    from: from.value || undefined,
    to: to.value || undefined,
    search: search.value.trim() || undefined,
  })
}
function scheduleLoad() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(runLoad, 250)
}
watch([formId, status, from, to, search], scheduleLoad)

onMounted(() => {
  store.loadForms()
  runLoad()
})

function fmt(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function summary(s: Submission): string {
  const vals = Object.values(s.data).filter(Boolean)
  return vals.slice(0, 3).join(' · ') || '—'
}

// Delivery + read state collapsed into one badge.
function badge(s: Submission): { label: string; cls: string } {
  if (s.seen) return { label: 'Seen', cls: 'bg-muted-bg text-muted-fg' }
  if (s.emailStatus === 'sent') {
    const recipients = (s.emailedTo ?? '').split(',').filter((a) => a.trim())
    const label = recipients.length > 1 ? `Sent · ${recipients.length} recipients` : recipients.length === 1 ? `Sent · ${recipients[0]!.trim()}` : 'Sent'
    return { label, cls: 'bg-blue-bg text-blue-fg' }
  }
  return { label: 'Unread', cls: 'bg-amber-bg text-amber-fg' }
}

function onRow(s: Submission) {
  if (expandedId.value === s.id) {
    expandedId.value = null
    return
  }
  expandedId.value = s.id
  store.markSeen(s.id)
}

const pendingDelete = ref<Submission | null>(null)
function remove(s: Submission) {
  pendingDelete.value = s
}
function doRemove() {
  const target = pendingDelete.value
  if (!target) return
  if (expandedId.value === target.id) expandedId.value = null
  store.remove(target.id)
  toast.success('Submission deleted')
  pendingDelete.value = null
}

// ── Export ──
const exportOpen = ref(false)
const exporting = ref(false)
const exFormId = ref('')
const exFrom = ref('')
const exTo = ref('')
const exFormat = ref('csv')
const formatOptions = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

function openExport() {
  // Prefill from the current filter bar as a convenience.
  exFormId.value = formId.value
  exFrom.value = from.value
  exTo.value = to.value
  exFormat.value = 'csv'
  exportOpen.value = true
}

async function runExport() {
  exporting.value = true
  try {
    await downloadSubmissions({
      formId: exFormId.value || undefined,
      from: exFrom.value || undefined,
      to: exTo.value || undefined,
      format: exFormat.value === 'json' ? 'json' : 'csv',
    })
    exportOpen.value = false
    toast.success('Export downloaded')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Export failed.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div v-if="!embedded" class="space-y-1">
        <h3 class="text-sm font-semibold text-foreground">Submissions</h3>
        <p class="text-xs leading-relaxed text-secondary">Everything captured from forms with “Save to database” on. Private — only signed-in admins can see this.</p>
      </div>
      <ButtonUi variant="outline" size="sm" class="shrink-0" :class="embedded && 'ml-auto'" @click="openExport">
        <IconUi name="download" size="size-3.5" /> Export
      </ButtonUi>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative min-w-40 flex-1">
        <IconUi name="search" size="size-3.5" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
        <InputUi v-model="search" placeholder="Search submissions..." class="pl-8" />
      </div>
      <div class="w-44 shrink-0"><DropdownUi v-model="formId" :options="formOptions" class="w-full" /></div>
      <div class="w-32 shrink-0"><DropdownUi v-model="status" :options="statusOptions" class="w-full" /></div>
      <InputUi v-model="from" type="date" class="w-36 shrink-0" />
      <InputUi v-model="to" type="date" class="w-36 shrink-0" />
    </div>

    <!-- List -->
    <div class="overflow-hidden rounded-xl border border-border/70 bg-background">
      <p v-if="store.loading && !store.items.length" class="px-4 py-8 text-center text-xs text-secondary">Loading…</p>
      <EmptyStateUi v-else-if="!store.items.length" compact message="No submissions match." class="py-10" />

      <div v-else class="divide-y divide-border/60">
        <div v-for="s in store.items" :key="s.id">
          <!-- Row -->
          <div class="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors duration-100 hover:bg-secondary/5" @click="onRow(s)">
            <span class="size-1.5 shrink-0 rounded-full" :class="s.seen ? 'bg-transparent' : 'bg-amber-fg'" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ s.formName }}</div>
              <div class="truncate text-xs text-secondary">{{ summary(s) }}</div>
            </div>
            <span class="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider" :class="badge(s).cls">{{ badge(s).label }}</span>
            <span class="hidden w-40 shrink-0 text-right text-xs text-secondary sm:block">{{ fmt(s.createdAt) }}</span>
            <IconButtonUi size="sm" variant="danger" title="Delete submission" class="shrink-0 opacity-0 group-hover:opacity-100" @click.stop="remove(s)">
              <IconUi name="delete" size="size-3.5" />
            </IconButtonUi>
          </div>

          <!-- Detail -->
          <div v-if="expandedId === s.id" class="space-y-2 border-t border-border/60 bg-secondary/5 px-4 py-3">
            <div v-for="(v, k) in s.data" :key="k" class="grid grid-cols-[8rem_1fr] gap-3 text-xs">
              <span class="truncate font-mono text-secondary">{{ k }}</span>
              <span class="whitespace-pre-wrap break-words">{{ v }}</span>
            </div>
            <div class="pt-1 text-[10px] text-secondary">
              {{ fmt(s.createdAt) }}<template v-if="s.pageUrl"> · {{ s.pageUrl }}</template><template v-if="s.ip"> · {{ s.ip }}</template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export scope modal -->
    <ModalUi
      v-model:open="exportOpen"
      variant="dialog"
      title="Export submissions"
      description="Choose what to include, then download."
    >
      <div class="space-y-3">
        <div class="space-y-1">
          <LabelUi size="xs">Form</LabelUi>
          <DropdownUi v-model="exFormId" :options="formOptions" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <LabelUi size="xs">From</LabelUi>
            <InputUi v-model="exFrom" type="date" />
          </div>
          <div class="space-y-1">
            <LabelUi size="xs">To</LabelUi>
            <InputUi v-model="exTo" type="date" />
          </div>
        </div>
        <div class="space-y-1">
          <LabelUi size="xs">Format</LabelUi>
          <SegmentedControlUi v-model="exFormat" :options="formatOptions" />
        </div>
      </div>

      <template #actions>
        <ButtonUi variant="ghost" size="sm" @click="exportOpen = false">Cancel</ButtonUi>
        <ButtonUi size="sm" :disabled="exporting" @click="runExport">{{ exporting ? 'Exporting…' : 'Export' }}</ButtonUi>
      </template>
    </ModalUi>

    <!-- Delete confirm dialog -->
    <ConfirmDialogUi
      :open="!!pendingDelete"
      title="Delete submission"
      :description="pendingDelete ? `Delete this submission from “${pendingDelete.formName}”? This can’t be undone.` : ''"
      confirm-label="Delete"
      @update:open="pendingDelete = null"
      @confirm="doRemove"
    />
  </section>
</template>
