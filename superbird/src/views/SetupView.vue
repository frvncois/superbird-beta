<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSetupStore } from '@/stores/setup'
import { useAuthStore } from '@/stores/auth'
import { useSiteSettingsStore } from '@/stores/siteSettings'
import { useProjectPersistence } from '@/composables/useProjectPersistence'
import { useMediaStore } from '@/stores/media'
import SuperbirdIcon from '@/components/header/SuperbirdIcon.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const router = useRouter()
const setup = useSetupStore()
const auth = useAuthStore()
const siteSettings = useSiteSettingsStore()

// 0 welcome · 1 project · 2 account · 3 done
const step = ref(0)

// ── Project ──
const projectName = ref('')
const handle = ref('')
const handleEdited = ref(false)

function slugify(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
// Auto-derive the handle from the name until the user edits it directly.
watch(projectName, (v) => {
  if (!handleEdited.value) handle.value = slugify(v)
})
function onHandleInput(v: string) {
  handleEdited.value = true
  handle.value = slugify(v)
}
const projectValid = computed(() => projectName.value.trim().length > 0 && handle.value.length > 0)

// ── Account ──
const adminName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordValid = computed(() => password.value.length >= 8)
const confirmValid = computed(() => confirm.value.length > 0 && confirm.value === password.value)
const accountValid = computed(
  () => adminName.value.trim().length > 0 && emailValid.value && passwordValid.value && confirmValid.value,
)

async function finish() {
  if (!accountValid.value || setup.installing) return
  try {
    const result = await setup.install({
      project: { name: projectName.value.trim(), handle: handle.value },
      admin: { name: adminName.value.trim(), email: email.value.trim(), password: password.value },
    })
    // Reflect the project name in site settings for the rest of the app.
    siteSettings.updateSiteIdentity({ title: result.project.name })
    // Install opened a session server-side — adopt the returned admin user.
    auth.hydrate(result.user)
    // Fresh project: persist the current demo seed as the starting point.
    await useProjectPersistence().load()
    await useMediaStore().load()
    step.value = 3
  } catch {
    // setup.error is shown inline
  }
}

function goToDashboard() {
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center bg-background p-6">
    <div class="w-full max-w-md">
      <!-- Brand -->
      <div class="mb-6 flex items-center gap-2.5">
        <div class="size-7 text-foreground"><SuperbirdIcon /></div>
        <span class="text-base font-semibold text-foreground">Superbird</span>
      </div>

      <!-- Card -->
      <div class="animate-fade-in-up rounded-2xl border border-border/70 bg-muted-bg p-6">
        <!-- Step 0: welcome -->
        <template v-if="step === 0">
          <h1 class="text-lg font-semibold text-foreground">Welcome</h1>
          <p class="mt-1.5 text-sm text-secondary">
            Let's set up your project and create your admin account. This takes about a minute.
          </p>
          <ButtonUi variant="solid" class="mt-6 w-full" @click="step = 1">
            Get started
            <IconUi name="arrow-right" size="size-4" />
          </ButtonUi>
        </template>

        <!-- Step 1: project -->
        <template v-else-if="step === 1">
          <div class="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-secondary/60">
            <span>Step 1 of 2</span>
          </div>
          <h1 class="text-lg font-semibold text-foreground">Your project</h1>
          <p class="mt-1 text-sm text-secondary">Name your site and choose its address.</p>

          <div class="mt-5 space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Project name</span>
              <InputUi v-model="projectName" size="default" placeholder="My Website" />
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Address</span>
              <div class="flex items-center gap-2">
                <InputUi
                  :model-value="handle"
                  size="default"
                  placeholder="my-website"
                  @update:model-value="onHandleInput"
                />
                <span class="shrink-0 text-xs text-secondary">.superbird.site</span>
              </div>
            </label>
          </div>

          <div class="mt-6 flex items-center gap-2">
            <ButtonUi variant="ghost" @click="step = 0">Back</ButtonUi>
            <ButtonUi variant="solid" class="ml-auto" :disabled="!projectValid" @click="step = 2">
              Continue
              <IconUi name="arrow-right" size="size-4" />
            </ButtonUi>
          </div>
        </template>

        <!-- Step 2: account -->
        <template v-else-if="step === 2">
          <div class="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-secondary/60">
            <span>Step 2 of 2</span>
          </div>
          <h1 class="text-lg font-semibold text-foreground">Admin account</h1>
          <p class="mt-1 text-sm text-secondary">This is the account you'll use to sign in.</p>

          <div class="mt-5 space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Name</span>
              <InputUi v-model="adminName" size="default" placeholder="Jane Doe" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Email</span>
              <InputUi v-model="email" size="default" type="email" placeholder="you@example.com" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Password</span>
              <InputUi v-model="password" size="default" type="password" placeholder="At least 8 characters" />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-foreground">Confirm password</span>
              <InputUi v-model="confirm" size="default" type="password" placeholder="Re-enter password" />
              <span v-if="confirm.length > 0 && !confirmValid" class="mt-1 block text-[10px] text-red-fg">
                Passwords don't match.
              </span>
            </label>
          </div>

          <p v-if="setup.error" class="mt-4 rounded-lg bg-red-bg px-3 py-2 text-xs text-red-fg">{{ setup.error }}</p>

          <div class="mt-6 flex items-center gap-2">
            <ButtonUi variant="ghost" :disabled="setup.installing" @click="step = 1">Back</ButtonUi>
            <ButtonUi variant="solid" class="ml-auto" :disabled="!accountValid || setup.installing" @click="finish">
              {{ setup.installing ? 'Setting up…' : 'Create project' }}
            </ButtonUi>
          </div>
        </template>

        <!-- Step 3: done -->
        <template v-else>
          <div class="flex flex-col items-center py-4 text-center">
            <div class="flex size-12 items-center justify-center rounded-2xl bg-green-bg text-green-fg">
              <IconUi name="check" size="size-6" />
            </div>
            <h1 class="mt-4 text-lg font-semibold text-foreground">You're all set</h1>
            <p class="mt-1.5 text-sm text-secondary">
              <span class="font-medium text-foreground">{{ setup.project?.name }}</span> is ready.
            </p>
            <ButtonUi variant="solid" class="mt-6 w-full" @click="goToDashboard">
              Go to dashboard
              <IconUi name="arrow-right" size="size-4" />
            </ButtonUi>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
