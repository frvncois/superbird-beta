<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSetupStore } from '@/stores/setup'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useMediaStore } from '@/stores/media'
import AuthShell from '@/layouts/AuthShell.vue'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import CardUi from '@/components/ui/CardUi.vue'

const router = useRouter()
const auth = useAuthStore()
const setup = useSetupStore()

const email = ref('')
const password = ref('')
const remember = ref(false)

// Two-step flow: credentials → (if 2FA on) a TOTP/recovery code.
const step = ref<'credentials' | 'twofactor'>('credentials')
const challenge = ref('')
const code = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0)
const welcome = computed(() => `Welcome back to ${setup.project?.name ?? 'Superbird'}.`)
const description = computed(() =>
  step.value === 'credentials' ? welcome.value : 'Enter the code from your authenticator app.',
)

async function finishSession() {
  await useProjectPersistence().load()
  await useMediaStore().load()
  router.push('/')
}

async function submit() {
  if (!canSubmit.value || auth.authenticating) return
  try {
    const result = await auth.login(email.value, password.value, remember.value)
    if ('twoFactorRequired' in result) {
      challenge.value = result.challenge
      step.value = 'twofactor'
      return
    }
    await finishSession()
  } catch {
    // auth.error is shown inline
  }
}

async function submitCode() {
  if (auth.authenticating || !code.value.trim()) return
  try {
    await auth.verifyTwoFactor(challenge.value, code.value.trim())
    await finishSession()
  } catch {
    // auth.error is shown inline
  }
}

function backToCredentials() {
  step.value = 'credentials'
  code.value = ''
  auth.error = null
}
</script>

<template>
  <AuthShell>
    <CardUi title="Superbird" :description="description">
      <!-- Header icon (in CardUi's chip span) -->
      <template #icon><div class="size-4"><SuperbirdIcon /></div></template>

      <!-- Step 1: credentials -->
      <form v-if="step === 'credentials'" @submit.prevent="submit" class="space-y-4">
        <InputUi v-model="email" label="Email" size="default" type="email" placeholder="you@example.com" />
        <InputUi v-model="password" label="Password" size="default" type="password" placeholder="Your password" />
        <label class="flex cursor-pointer items-center gap-2 select-none">
          <ToggleUi v-model="remember" />
          <span class="text-xs text-secondary">Keep me signed in for 30 days</span>
        </label>
        <p v-if="auth.error" class="rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ auth.error }}</p>
      </form>

      <!-- Step 2: two-factor code -->
      <form v-else @submit.prevent="submitCode" class="space-y-4">
        <InputUi
          v-model="code"
          label="Authentication code"
          size="default"
          inputmode="numeric"
          autocomplete="one-time-code"
          placeholder="123456"
        />
        <p class="text-[11px] text-secondary">Lost your device? Enter one of your recovery codes instead.</p>
        <p v-if="auth.error" class="rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ auth.error }}</p>
      </form>

      <!-- Actions -->
      <template #actions>
        <ButtonUi
          v-if="step === 'credentials'"
          variant="default"
          class="w-full"
          :disabled="!canSubmit || auth.authenticating"
          @click="submit"
        >
          {{ auth.authenticating ? 'Signing in…' : 'Sign in' }}
        </ButtonUi>
        <template v-else>
          <ButtonUi variant="ghost" :disabled="auth.authenticating" @click="backToCredentials">Back</ButtonUi>
          <ButtonUi
            variant="default"
            class="flex-1"
            :disabled="!code.trim() || auth.authenticating"
            @click="submitCode"
          >
            {{ auth.authenticating ? 'Verifying…' : 'Verify' }}
          </ButtonUi>
        </template>
      </template>
    </CardUi>
  </AuthShell>
</template>
