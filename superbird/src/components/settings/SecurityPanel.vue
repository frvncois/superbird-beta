<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import SettingsPanel from './SettingsPanel.vue'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()

async function signOutEverywhere() {
  busy.value = true
  try {
    await auth.logoutAll()
    router.push('/login')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not sign out.')
  } finally {
    busy.value = false
  }
}

const enabled = computed(() => auth.currentUser?.twoFactorEnabled ?? false)

// Local state machine: idle → setup (secret shown, confirm code) → recovery
// (one-time codes shown after enabling).
type Mode = 'idle' | 'setup' | 'recovery'
const mode = ref<Mode>('idle')
const busy = ref(false)

const secret = ref('')
const otpauthUri = ref('')
const setupCode = ref('')
const recoveryCodes = ref<string[]>([])
const disableCode = ref('')

async function startSetup() {
  busy.value = true
  try {
    const s = await auth.setupTwoFactor()
    secret.value = s.secret
    otpauthUri.value = s.otpauthUri
    setupCode.value = ''
    mode.value = 'setup'
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not start setup.')
  } finally {
    busy.value = false
  }
}

async function confirmEnable() {
  if (!setupCode.value.trim()) return
  busy.value = true
  try {
    const { recoveryCodes: codes } = await auth.enableTwoFactor(setupCode.value.trim())
    recoveryCodes.value = codes
    mode.value = 'recovery'
    toast.success('Two-factor authentication is on')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not enable two-factor.')
  } finally {
    busy.value = false
  }
}

async function disable() {
  if (!disableCode.value.trim()) return
  busy.value = true
  try {
    await auth.disableTwoFactor(disableCode.value.trim())
    disableCode.value = ''
    toast.success('Two-factor authentication turned off')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not turn off two-factor.')
  } finally {
    busy.value = false
  }
}

function cancelSetup() {
  mode.value = 'idle'
  secret.value = ''
  otpauthUri.value = ''
  setupCode.value = ''
}

function finishRecovery() {
  mode.value = 'idle'
  recoveryCodes.value = []
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error('Could not copy')
  }
}
</script>

<template>
  <SettingsPanel title="Security">
    <SettingsSection
      title="Two-factor authentication"
      description="Require a time-based code from an authenticator app (Google Authenticator, 1Password, …) in addition to your password."
    >
      <!-- Status + primary action -->
      <SettingsRow label="Authenticator app">
        <template v-if="enabled">
          <BadgeUi variant="success" size="xs" dot>On</BadgeUi>
        </template>
        <template v-else-if="mode === 'idle'">
          <ButtonUi size="sm" :disabled="busy" @click="startSetup">Set up</ButtonUi>
        </template>
        <BadgeUi v-else variant="default" size="xs" dot>Setting up…</BadgeUi>
      </SettingsRow>

      <!-- Setup: show secret + confirm a code -->
      <SettingsRow v-if="mode === 'setup'" stacked>
        <div class="space-y-3">
          <p class="text-xs leading-relaxed text-secondary">
            In your authenticator app, add an account and enter this setup key (or open the link on the device that has the app):
          </p>

          <div class="flex items-center gap-2">
            <code class="min-w-0 flex-1 truncate rounded-lg bg-secondary/8 px-3 py-2 font-mono text-xs tracking-wider text-foreground">{{ secret }}</code>
            <ButtonUi size="sm" variant="outline" icon="copy" @click="copy(secret, 'Setup key')">Copy</ButtonUi>
          </div>

          <a :href="otpauthUri" class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <IconUi name="external-link" size="size-3.5" /> Open in authenticator app
          </a>

          <div class="pt-1">
            <label class="mb-1 block text-xs text-foreground">Enter the 6-digit code to confirm</label>
            <div class="flex items-center gap-2">
              <InputUi v-model="setupCode" inputmode="numeric" placeholder="123456" class="max-w-[10rem]" @keydown.enter="confirmEnable" />
              <ButtonUi size="sm" :disabled="!setupCode.trim() || busy" @click="confirmEnable">Enable</ButtonUi>
              <ButtonUi size="sm" variant="ghost" :disabled="busy" @click="cancelSetup">Cancel</ButtonUi>
            </div>
          </div>
        </div>
      </SettingsRow>

      <!-- Recovery codes: shown once, right after enabling -->
      <SettingsRow v-if="mode === 'recovery'" stacked>
        <div class="space-y-3">
          <div class="flex items-start gap-2 rounded-lg bg-amber-bg px-3 py-2 text-xs text-amber-fg">
            <IconUi name="alert" size="size-4" class="mt-px shrink-0" />
            <span>Save these recovery codes now — each works once if you lose your device. They won't be shown again.</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <code
              v-for="rc in recoveryCodes"
              :key="rc"
              class="rounded-lg bg-secondary/8 px-3 py-1.5 text-center font-mono text-xs tracking-wider text-foreground"
            >{{ rc }}</code>
          </div>
          <div class="flex items-center gap-2">
            <ButtonUi size="sm" variant="outline" icon="copy" @click="copy(recoveryCodes.join('\n'), 'Recovery codes')">Copy all</ButtonUi>
            <ButtonUi size="sm" @click="finishRecovery">I've saved them</ButtonUi>
          </div>
        </div>
      </SettingsRow>

      <!-- Disable: needs a current code -->
      <SettingsRow v-if="enabled" stacked>
        <div class="space-y-2">
          <label class="block text-xs text-foreground">Turn off two-factor</label>
          <p class="text-xs text-secondary">Enter a current authenticator or recovery code to confirm.</p>
          <div class="flex items-center gap-2">
            <InputUi v-model="disableCode" inputmode="numeric" placeholder="123456" class="max-w-[10rem]" @keydown.enter="disable" />
            <ButtonUi size="sm" variant="danger" :disabled="!disableCode.trim() || busy" @click="disable">Turn off</ButtonUi>
          </div>
        </div>
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="Sessions" description="Sign out of Superbird on every device where you're currently logged in.">
      <SettingsRow label="Active sessions" description="Ends this session too — you'll need to sign in again.">
        <ButtonUi size="sm" variant="outline" :disabled="busy" @click="signOutEverywhere">Log out all devices</ButtonUi>
      </SettingsRow>
    </SettingsSection>
    </SettingsPanel>
</template>
