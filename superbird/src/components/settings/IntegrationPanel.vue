<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAiConfig, saveAiConfig } from '@/lib/ai/aiApi'
import { useAssistantStore } from '@/stores/assistant'
import type { AiProvider } from '@shared/types'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'

const assistant = useAssistantStore()

const provider = ref<AiProvider>('anthropic')
const apiKey = ref('')
const model = ref('claude-sonnet-5')
const baseUrl = ref('')
const configured = ref(false)
const saving = ref(false)
const message = ref('')
const error = ref('')

const providerOptions = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'groq', label: 'Groq' },
  { value: 'custom', label: 'Custom' },
]

// Preset models per provider (must support tool / function calling).
const MODELS: Partial<Record<AiProvider, { value: string; label: string }[]>> = {
  anthropic: [
    { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (recommended)' },
    { value: 'claude-opus-4-8', label: 'Claude Opus 4.8 (most capable)' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fastest)' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (recommended)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (fastest)' },
    { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
  ],
}
const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4.1',
  groq: 'llama-3.3-70b-versatile',
  custom: '',
}

const isCustom = computed(() => provider.value === 'custom')
const modelOptions = computed(() => MODELS[provider.value] ?? [])
const keyPlaceholder = computed(() =>
  provider.value === 'anthropic' ? 'sk-ant-…' : provider.value === 'groq' ? 'gsk_…' : 'sk-…',
)
const keyOptional = computed(() => isCustom.value)

function onProviderChange(p: string) {
  provider.value = p as AiProvider
  model.value = DEFAULT_MODEL[provider.value]
  if (provider.value !== 'custom') baseUrl.value = ''
}

onMounted(async () => {
  try {
    const cfg = await getAiConfig()
    configured.value = cfg.configured
    provider.value = cfg.provider
    model.value = cfg.model
    baseUrl.value = cfg.baseUrl
  } catch {
    /* not installed / offline */
  }
})

async function save() {
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    const cfg = await saveAiConfig({
      provider: provider.value,
      model: model.value.trim(),
      baseUrl: isCustom.value ? baseUrl.value.trim() : undefined,
      apiKey: apiKey.value.trim() || undefined,
    })
    configured.value = cfg.configured
    apiKey.value = ''
    message.value = 'Saved.'
    assistant.loadConfig()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not save.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-10">
    <SettingsSection
      title="AI Assistant"
      description="Connect an AI provider. Your key is stored on your server and never sent to the browser — the app proxies each request."
    >
      <SettingsRow label="Status">
        <BadgeUi :variant="configured ? 'success' : 'neutral'" size="xs" mono>
          {{ configured ? 'Connected' : 'Not configured' }}
        </BadgeUi>
      </SettingsRow>

      <SettingsRow label="Provider">
        <SegmentedControlUi :model-value="provider" :options="providerOptions" @update:model-value="onProviderChange" />
      </SettingsRow>

      <SettingsRow v-if="isCustom" label="Base URL" description="Any OpenAI-compatible endpoint (OpenRouter, Ollama, LM Studio, …).">
        <InputUi v-model="baseUrl" placeholder="https://openrouter.ai/api/v1" />
      </SettingsRow>

      <SettingsRow label="Model" :description="isCustom ? 'The model id at your endpoint (must support tool calling).' : undefined">
        <InputUi v-if="isCustom" v-model="model" placeholder="e.g. meta-llama/llama-3.3-70b-instruct" />
        <SelectUi v-else v-model="model" :options="modelOptions" />
      </SettingsRow>

      <SettingsRow
        label="API key"
        :description="keyOptional ? 'Optional for local endpoints (e.g. Ollama).' : configured ? 'A key is saved. Enter a new one to replace it.' : 'Required.'"
      >
        <InputUi v-model="apiKey" type="password" :placeholder="configured ? '•••••••• (unchanged)' : keyPlaceholder" />
      </SettingsRow>

      <div class="flex items-center gap-3 px-4 py-3">
        <ButtonUi :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</ButtonUi>
        <span v-if="message" class="text-xs text-green-fg">{{ message }}</span>
        <span v-if="error" class="text-xs text-red-fg">{{ error }}</span>
      </div>

      <p v-if="provider === 'groq'" class="px-4 pb-3 text-xs leading-relaxed text-secondary">
        Groq has a free tier — get a key at <span class="font-mono text-foreground">console.groq.com/keys</span>. Pick a
        model that supports tool calling (the recommended one does).
      </p>
    </SettingsSection>

    <SettingsSection title="How it works" description="What the assistant can do once connected.">
      <div class="px-4 py-3 text-xs leading-relaxed text-secondary">
        Open the <span class="font-medium text-foreground">Assistant</span> (sparkle button, bottom-right) and describe what
        you want. It can create and edit pages, build layouts, style with classes and design tokens, add animations, links,
        translations and CMS collections — driving the builder the same way you would. Changes appear live and are undoable.
      </div>
    </SettingsSection>
  </div>
</template>
