<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { apiGet, apiPut } from '@/lib/api'
import { useCanvasStore } from '@/stores/canvas'
import { useToast } from '@/composables/useToast'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'

interface StoreConfig {
  enabled: boolean
  currency: string
  stripePublishableKey: string
  hasSecretKey: boolean
  hasWebhookSecret: boolean
}

const canvas = useCanvasStore()
const toast = useToast()

const cfg = reactive({ enabled: false, currency: 'usd', stripePublishableKey: '' })
const hasSecretKey = ref(false)
const hasWebhookSecret = ref(false)
const secretKey = ref('')
const webhookSecret = ref('')
const busy = ref(false)
const saving = ref(false)

const currencyOptions = ['usd', 'eur', 'gbp', 'cad', 'aud', 'nzd', 'jpy', 'chf', 'sek', 'dkk', 'nok'].map((c) => ({ value: c, label: c.toUpperCase() }))

async function load() {
  const c = await apiGet<StoreConfig>('/api/store/config')
  Object.assign(cfg, { enabled: c.enabled, currency: c.currency, stripePublishableKey: c.stripePublishableKey })
  hasSecretKey.value = c.hasSecretKey
  hasWebhookSecret.value = c.hasWebhookSecret
}
onMounted(load)

async function toggleEnabled(v: boolean) {
  if (v) {
    busy.value = true
    try {
      const created = canvas.ensureStoreSystemPages()
      await apiPut('/api/store/config', { enabled: true })
      cfg.enabled = true
      toast.success(created.length ? `Store activated — ${created.length} system page${created.length > 1 ? 's' : ''} created` : 'Store activated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the store.')
    } finally {
      busy.value = false
    }
    return
  }

  // Deactivating removes the store system pages — confirm first.
  pendingDeactivate.value = true
}

const pendingDeactivate = ref(false)
async function doDeactivate() {
  pendingDeactivate.value = false
  busy.value = true
  try {
    const removed = canvas.removeStoreSystemPages()
    await apiPut('/api/store/config', { enabled: false })
    cfg.enabled = false
    toast.success(removed ? `Store deactivated — ${removed} system page${removed > 1 ? 's' : ''} removed` : 'Store deactivated')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not update the store.')
  } finally {
    busy.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const payload: Record<string, unknown> = { currency: cfg.currency, stripePublishableKey: cfg.stripePublishableKey }
    if (secretKey.value) payload.stripeSecretKey = secretKey.value
    if (webhookSecret.value) payload.stripeWebhookSecret = webhookSecret.value
    const c = await apiPut<StoreConfig>('/api/store/config', payload)
    hasSecretKey.value = c.hasSecretKey
    hasWebhookSecret.value = c.hasWebhookSecret
    secretKey.value = ''
    webhookSecret.value = ''
    toast.success('Store settings saved')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not save.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-10">
    <SettingsSection title="Store" description="Turn the store on to add products, take orders, and let customers sign in. Activating creates the Login, Account, Cart, and Order-confirmation system pages in your editor.">
      <SettingsRow label="Activate store" :description="cfg.enabled ? 'Your store is live.' : 'Off — no storefront or checkout.'">
        <ToggleUi :model-value="cfg.enabled" :disabled="busy" @update:model-value="toggleEnabled" />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Payments (Stripe)" description="Payments are handled entirely by Stripe. Your secret key and webhook secret stay on your server and are never included in backups.">
      <SettingsRow label="Currency">
        <SelectUi v-model="cfg.currency" :options="currencyOptions" />
      </SettingsRow>
      <SettingsRow label="Secret key" :description="hasSecretKey ? 'A key is saved. Leave blank to keep it.' : 'sk_live_… / sk_test_…'">
        <InputUi v-model="secretKey" type="password" :placeholder="hasSecretKey ? '••••••••' : 'sk_…'" />
      </SettingsRow>
      <SettingsRow label="Publishable key" description="pk_live_… / pk_test_… (safe to expose).">
        <InputUi v-model="cfg.stripePublishableKey" placeholder="pk_…" />
      </SettingsRow>
      <SettingsRow label="Webhook signing secret" :description="hasWebhookSecret ? 'A secret is saved. Leave blank to keep it.' : 'whsec_… — from your Stripe webhook.'">
        <InputUi v-model="webhookSecret" type="password" :placeholder="hasWebhookSecret ? '••••••••' : 'whsec_…'" />
      </SettingsRow>
      <div class="flex justify-end px-4 py-3">
        <ButtonUi size="sm" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</ButtonUi>
      </div>
    </SettingsSection>

    <ModalUi
      :open="pendingDeactivate"
      variant="dialog"
      danger
      icon="alert"
      title="Deactivate store"
      description="This turns off the storefront and removes its Login, Account, Cart, and Order-confirmation pages. Your products, orders, and customers are kept."
      @update:open="pendingDeactivate = false"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingDeactivate = false">Cancel</ButtonUi>
        <ButtonUi variant="danger" @click="doDeactivate">Deactivate</ButtonUi>
      </template>
    </ModalUi>
  </div>
</template>
