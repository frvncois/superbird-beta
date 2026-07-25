<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useMediaStore } from '@/stores/media'
import AuthShell from '@/layouts/AuthShell.vue'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import CardUi from '@/components/ui/CardUi.vue'

const router = useRouter()
const setup = useSetupStore()
const auth = useAuthStore()
const siteSettings = useSiteSettingsStore()

const projectName = ref('')
const adminName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

// The public handle is derived from the project name (no separate field).
function slugify(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordValid = computed(() => password.value.length >= 8)
const confirmValid = computed(() => confirm.value.length > 0 && confirm.value === password.value)
const canSubmit = computed(
  () =>
    projectName.value.trim().length > 0 &&
    adminName.value.trim().length > 0 &&
    emailValid.value &&
    passwordValid.value &&
    confirmValid.value,
)

async function submit() {
  if (!canSubmit.value || setup.installing) return
  const handle = slugify(projectName.value.trim())
  if (!handle) return
  try {
    const result = await setup.install({
      project: { name: projectName.value.trim(), handle },
      admin: { name: adminName.value.trim(), email: email.value.trim(), password: password.value },
    })
    // Reflect the project name in site settings for the rest of the app.
    siteSettings.updateSiteIdentity({ title: result.project.name })
    // Install opened a session server-side — adopt the returned admin user.
    auth.hydrate(result.user)
    // Fresh project: persist the current demo seed as the starting point.
    await useProjectPersistence().load()
    await useMediaStore().load()
    router.push('/')
  } catch {
    // setup.error is shown inline
  }
}
</script>

<template>
  <AuthShell>
      <CardUi title="Superbird" description="Setup your project and create the admin account.">
        <!-- Header icon (in CardUi's chip span) -->
        <template #icon><div class="size-4"><SuperbirdIcon /></div></template>

        <!-- Content -->
        <form @submit.prevent="submit" class="space-y-4">
          <InputUi v-model="projectName" label="Project name" size="default" placeholder="My Website" />
          <InputUi v-model="adminName" label="Name" size="default" placeholder="Jane Doe" />
          <InputUi v-model="email" label="Email" size="default" type="email" placeholder="you@example.com" />
          <InputUi v-model="password" label="Password" size="default" type="password" placeholder="At least 8 characters" />
          <div>
            <InputUi v-model="confirm" label="Confirm password" size="default" type="password" placeholder="Re-enter password" />
            <span v-if="confirm.length > 0 && !confirmValid" class="mt-1 block text-[10px] text-red-fg">
              Passwords don't match.
            </span>
          </div>
          <p v-if="setup.error" class="rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ setup.error }}</p>
        </form>

        <!-- Actions -->
        <template #actions>
          <ButtonUi variant="default" class="w-full" :disabled="!canSubmit || setup.installing" @click="submit">
            {{ setup.installing ? 'Creating…' : 'Create project' }}
          </ButtonUi>
        </template>
      </CardUi>
  </AuthShell>
</template>
