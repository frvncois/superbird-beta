<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import type { CanvasNode, FormConfig } from '@/types/canvas'
import SettingsPanel from './SettingsPanel.vue'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import SubmissionsSection from './SubmissionsSection.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'

const tab = ref<'settings' | 'submissions'>('settings')
const tabOptions = [
  { value: 'settings', label: 'Settings' },
  { value: 'submissions', label: 'Submissions' },
]
const tabProxy = computed<string>({ get: () => tab.value, set: (v) => (tab.value = v as 'settings' | 'submissions') })

const canvas = useCanvasStore()
const site = useSiteSettingsStore()

const FIELD_TYPES = ['input', 'textarea', 'select', 'checkbox', 'radio']

interface FoundForm {
  formId: string
  pageName: string
  detectedName?: string
  fields: string[]
}

// Every form element placed across all pages (config is keyed by node id).
const forms = computed<FoundForm[]>(() => {
  const out: FoundForm[] = []
  const walk = (node: CanvasNode, pageName: string) => {
    if (node.type === 'form') {
      const fields: string[] = []
      const collect = (n: CanvasNode) => {
        const name = n.props?.name
        if (FIELD_TYPES.includes(n.type) && name) fields.push(String(name))
        for (const c of n.children ?? []) collect(c)
      }
      collect(node)
      out.push({ formId: node.id, pageName, detectedName: node.props?.name as string | undefined, fields })
    }
    for (const c of node.children ?? []) walk(c, pageName)
  }
  for (const page of canvas.pages) if (page.body) walk(page.body, page.name)
  return out
})

function cfg(formId: string): FormConfig {
  return site.siteSettings.forms[formId] ?? { saveToDb: true }
}
function update(formId: string, patch: Partial<FormConfig>) {
  site.updateFormConfig(formId, patch)
}
</script>

<template>
  <SettingsPanel title="Forms">
    <SegmentedControlUi v-model="tabProxy" :options="tabOptions" />

    <SubmissionsSection v-if="tab === 'submissions'" />

    <template v-else>
      <SettingsSection
        bare
        title="Form settings"
        description="Decide what happens to each form's submissions. Saved submissions appear in the Submissions list."
      >
      <EmptyStateUi
        v-if="!forms.length"
        compact
        message="No forms yet. Add a Form element to a page, then configure it here."
        class="rounded-xl border border-border/70 py-8"
      />

      <div
        v-for="form in forms"
        :key="form.formId"
        class="overflow-hidden rounded-xl border border-border/70 bg-background"
      >
        <!-- Header: name + page -->
        <div class="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <IconUi name="form" size="size-4" class="shrink-0 text-secondary" />
          <div class="min-w-0 flex-1">
            <InputUi
              :model-value="cfg(form.formId).name ?? ''"
              :placeholder="form.detectedName || 'Untitled form'"
              @update:model-value="update(form.formId, { name: $event || undefined })"
            />
          </div>
          <span class="shrink-0 font-mono text-[10px] uppercase tracking-wider text-secondary">On {{ form.pageName }}</span>
        </div>

        <!-- Field preview -->
        <div v-if="form.fields.length" class="flex flex-wrap gap-1.5 border-b border-border/60 px-4 py-2.5">
          <span
            v-for="(f, i) in form.fields"
            :key="`${f}-${i}`"
            class="rounded bg-secondary/10 px-1.5 py-0.5 font-mono text-[10px] text-secondary"
          >{{ f }}</span>
        </div>

        <!-- Settings -->
        <div class="divide-y divide-border/60">
          <SettingsRow label="Save submissions to database" description="Keep every submission in the Submissions list below.">
            <ToggleUi
              :model-value="cfg(form.formId).saveToDb"
              @update:model-value="update(form.formId, { saveToDb: $event })"
            />
          </SettingsRow>
          <SettingsRow label="Notification emails" description="Where submissions are emailed. Comma-separate for several recipients (needs SMTP).">
            <InputUi
              :model-value="cfg(form.formId).notificationEmail ?? ''"
              placeholder="you@site.com, team@site.com"
              @update:model-value="update(form.formId, { notificationEmail: $event || undefined })"
            />
          </SettingsRow>
          <SettingsRow label="Webhook URL" description="POST each submission as JSON to this URL.">
            <InputUi
              :model-value="cfg(form.formId).webhookUrl ?? ''"
              placeholder="https://…"
              @update:model-value="update(form.formId, { webhookUrl: $event || undefined })"
            />
          </SettingsRow>
          <SettingsRow label="Success message" description="Shown to the visitor after they submit." stacked>
            <InputUi
              :model-value="cfg(form.formId).successMessage ?? ''"
              placeholder="Thanks! Your submission was received."
              @update:model-value="update(form.formId, { successMessage: $event || undefined })"
            />
          </SettingsRow>
        </div>
      </div>
      </SettingsSection>
    </template>
  </SettingsPanel>
</template>
