<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { apiGet, apiPut, apiPost } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  username: string
  fromEmail: string
  fromName: string
  hasPassword: boolean
}

const toast = useToast()

const config = reactive({ host: '', port: 587, secure: false, username: '', fromEmail: '', fromName: '' })
const password = ref('')
const hasPassword = ref(false)
const saving = ref(false)
const testing = ref(false)

async function load() {
  const c = await apiGet<SmtpConfig>('/api/forms/smtp')
  Object.assign(config, { host: c.host, port: c.port, secure: c.secure, username: c.username, fromEmail: c.fromEmail, fromName: c.fromName })
  hasPassword.value = c.hasPassword
}
onMounted(load)

async function save() {
  saving.value = true
  try {
    const payload: Record<string, unknown> = { ...config }
    if (password.value) payload.password = password.value
    const c = await apiPut<SmtpConfig>('/api/forms/smtp', payload)
    hasPassword.value = c.hasPassword
    password.value = ''
    toast.success('SMTP settings saved')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not save SMTP settings.')
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  testing.value = true
  try {
    const r = await apiPost<{ to: string }>('/api/forms/smtp/test', {})
    toast.success(`Test email sent to ${r.to}`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Test email failed.')
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <SettingsSection title="Email delivery (SMTP)" description="Connect an SMTP account to email form submissions. Credentials stay on your server and are never included in backups.">
    <SettingsRow label="SMTP host" description="e.g. smtp.postmarkapp.com">
      <InputUi v-model="config.host" placeholder="smtp.example.com" />
    </SettingsRow>
    <SettingsRow label="Port" description="465 for SSL, 587 for STARTTLS.">
      <div class="flex items-center gap-2">
        <InputUi :model-value="String(config.port)" type="number" class="w-20" @update:model-value="config.port = Number($event) || 0" />
        <label class="flex items-center gap-1.5 text-xs text-secondary">
          <ToggleUi v-model="config.secure" /> SSL
        </label>
      </div>
    </SettingsRow>
    <SettingsRow label="Username">
      <InputUi v-model="config.username" placeholder="apikey / user" />
    </SettingsRow>
    <SettingsRow label="Password" :description="hasPassword ? 'A password is saved. Leave blank to keep it.' : 'App password or SMTP key.'">
      <InputUi v-model="password" type="password" :placeholder="hasPassword ? '••••••••' : ''" />
    </SettingsRow>
    <SettingsRow label="From email" description="The address submissions are sent from.">
      <InputUi v-model="config.fromEmail" placeholder="hello@yoursite.com" />
    </SettingsRow>
    <SettingsRow label="From name">
      <InputUi v-model="config.fromName" placeholder="Your Site" />
    </SettingsRow>
    <div class="flex items-center justify-end gap-2 px-4 py-3">
      <ButtonUi variant="outline" size="sm" :disabled="testing || saving" @click="sendTest">
        {{ testing ? 'Sending…' : 'Send test email' }}
      </ButtonUi>
      <ButtonUi size="sm" :disabled="saving" @click="save">
        {{ saving ? 'Saving…' : 'Save' }}
      </ButtonUi>
    </div>
  </SettingsSection>
</template>
