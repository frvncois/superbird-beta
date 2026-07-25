<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { listUsers, createUser, deleteUser } from '@/lib/users'
import type { User } from '@shared/types'
import SettingsSection from './SettingsSection.vue'
import SettingsPanel from './SettingsPanel.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'

const auth = useAuthStore()
const toast = useToast()

const users = ref<User[]>([])
const loading = ref(true)
const listError = ref('')

async function load() {
  loading.value = true
  listError.value = ''
  try {
    users.value = (await listUsers()).users
  } catch (e) {
    listError.value = e instanceof Error ? e.message : 'Could not load users.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Add
const name = ref('')
const email = ref('')
const password = ref('')
const adding = ref(false)
const addError = ref('')

async function add() {
  addError.value = ''
  if (!name.value.trim() || !email.value.trim() || !password.value) {
    addError.value = 'Name, email and password are required.'
    return
  }
  adding.value = true
  try {
    const added = name.value.trim()
    await createUser({ name: added, email: email.value.trim(), password: password.value })
    name.value = ''
    email.value = ''
    password.value = ''
    await load()
    toast.success(`${added} added`)
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Could not add user.'
  } finally {
    adding.value = false
  }
}

// Remove
const removingId = ref<string | null>(null)
const pendingRemove = ref<User | null>(null)
function remove(user: User) {
  pendingRemove.value = user
}
async function doRemove() {
  const user = pendingRemove.value
  if (!user) return
  pendingRemove.value = null
  removingId.value = user.id
  try {
    await deleteUser(user.id)
    await load()
    toast.success(`${user.name} removed`)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Could not remove user.')
  } finally {
    removingId.value = null
  }
}

function initials(u: User): string {
  return u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}
</script>

<template>
  <SettingsPanel title="Users">
    <SettingsSection title="Team" description="People who can sign in and manage this site.">
      <p v-if="loading" class="px-4 py-3 text-xs text-secondary">Loading…</p>
      <p v-else-if="listError" class="px-4 py-3 text-xs text-red-fg">{{ listError }}</p>

      <div v-else class="divide-y">
        <div v-for="user in users" :key="user.id" class="flex items-center gap-3 px-4 py-3">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-[11px] font-mono font-medium text-secondary">
            {{ initials(user) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium text-foreground">{{ user.name }}</span>
              <BadgeUi v-if="auth.currentUser?.id === user.id" variant="primary" size="xs" mono>You</BadgeUi>
            </div>
            <span class="truncate text-xs text-secondary">{{ user.email }}</span>
          </div>
          <IconButtonUi
            size="sm"
            variant="danger"
            title="Remove user"
            :disabled="auth.currentUser?.id === user.id || users.length <= 1 || removingId === user.id"
            @click="remove(user)"
          >
            <IconUi name="close" size="size-3" />
          </IconButtonUi>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="Add a user" description="They sign in with the email and password you set here.">
      <div class="space-y-2 px-4 py-3">
        <div class="flex flex-wrap gap-2">
          <InputUi v-model="name" placeholder="Full name" class="min-w-40 flex-1" />
          <InputUi v-model="email" type="email" placeholder="Email" class="min-w-48 flex-1" />
        </div>
        <div class="flex flex-wrap gap-2">
          <InputUi v-model="password" type="password" placeholder="Temporary password" class="min-w-48 flex-1" @keydown.enter="add" />
          <ButtonUi :disabled="adding" @click="add">{{ adding ? 'Adding…' : 'Add user' }}</ButtonUi>
        </div>
        <p v-if="addError" class="text-xs text-red-fg">{{ addError }}</p>
      </div>
    </SettingsSection>

    <ModalUi
      :open="!!pendingRemove"
      variant="dialog"
      danger
      icon="alert"
      title="Remove user"
      :description="pendingRemove ? `Remove ${pendingRemove.name} (${pendingRemove.email})? They will lose access to this site.` : ''"
      @update:open="pendingRemove = null"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingRemove = null">Cancel</ButtonUi>
        <ButtonUi variant="danger" @click="doRemove">Remove</ButtonUi>
      </template>
    </ModalUi>
  </SettingsPanel>
</template>
