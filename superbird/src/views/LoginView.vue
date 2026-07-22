<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSetupStore } from '@/stores/setup'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'

const router = useRouter()
const auth = useAuthStore()
const setup = useSetupStore()

const email = ref('')
const password = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0)

async function submit() {
  if (!canSubmit.value || auth.authenticating) return
  try {
    await auth.login(email.value, password.value)
    await useProjectPersistence().load()
    router.push('/')
  } catch {
    // auth.error is shown inline
  }
}
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center bg-background p-6">
    <div class="w-full max-w-sm">
      <!-- Brand -->
      <div class="mb-6 flex items-center gap-2.5">
        <div class="size-7 text-foreground"><SuperbirdIcon /></div>
        <span class="text-base font-semibold text-foreground">Superbird</span>
      </div>

      <form class="animate-fade-in-up rounded-2xl border border-border/70 bg-muted-bg p-6" @submit.prevent="submit">
        <h1 class="text-lg font-semibold text-foreground">Sign in</h1>
        <p class="mt-1 text-sm text-secondary">
          Welcome back to <span class="font-medium text-foreground">{{ setup.project?.name ?? 'Superbird' }}</span>.
        </p>

        <div class="mt-5 space-y-4">
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-foreground">Email</span>
            <InputUi v-model="email" size="default" type="email" placeholder="you@example.com" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-xs font-medium text-foreground">Password</span>
            <InputUi v-model="password" size="default" type="password" placeholder="Your password" />
          </label>
        </div>

        <p v-if="auth.error" class="mt-4 rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ auth.error }}</p>

        <ButtonUi variant="solid" class="mt-6 w-full" :disabled="!canSubmit || auth.authenticating">
          {{ auth.authenticating ? 'Signing in…' : 'Sign in' }}
        </ButtonUi>
      </form>
    </div>
  </div>
</template>
