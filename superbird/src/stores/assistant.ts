import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getAiConfig } from '@/lib/ai/aiApi'
import { runAgent } from '@/lib/ai/agent'
import type { AiConfigPublic, AiMessage } from '@shared/types'

// A single item in the chat transcript (UI projection).
export type ChatItem =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'assistant'; text: string }
  | { id: number; kind: 'tool'; name: string; status: 'running' | 'done' | 'error'; summary: string }
  | { id: number; kind: 'error'; text: string }

let seq = 0
const nextId = () => ++seq

// Short human label for a tool call.
const TOOL_VERB: Record<string, string> = {
  get_overview: 'Reading the site',
  get_page_tree: 'Reading the page',
  get_node: 'Inspecting an element',
  create_page: 'Creating a page',
  set_active_page: 'Switching page',
  add_node: 'Adding an element',
  update_node: 'Updating an element',
  set_node_content: 'Writing content',
  move_node: 'Moving an element',
  duplicate_node: 'Duplicating an element',
  delete_node: 'Deleting an element',
  set_node_link: 'Setting a link',
  create_style_class: 'Creating a style',
  set_node_styles: 'Styling',
  set_global_token: 'Setting a design token',
  add_interaction: 'Adding an animation',
  create_collection: 'Creating a collection',
  add_entry: 'Adding an entry',
  set_entry_value: 'Filling a field',
  add_locale: 'Adding a language',
  set_translation: 'Adding a translation',
}

export const useAssistantStore = defineStore('assistant', () => {
  const isOpen = ref(false)
  const config = ref<AiConfigPublic | null>(null)
  const sending = ref(false)
  const items = ref<ChatItem[]>([])

  // The raw provider conversation (drives multi-turn context).
  const conversation = ref<AiMessage[]>([])
  const runningTool = ref<ChatItem | null>(null)

  const configured = computed(() => config.value?.configured ?? false)

  async function loadConfig() {
    try {
      config.value = await getAiConfig()
    } catch {
      config.value = null
    }
  }

  function open() {
    isOpen.value = true
    if (!config.value) loadConfig()
  }
  function close() {
    isOpen.value = false
  }
  function toggle() {
    isOpen.value ? close() : open()
  }

  function reset() {
    items.value = []
    conversation.value = []
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending.value) return
    if (!configured.value) {
      items.value.push({ id: nextId(), kind: 'error', text: 'Add an AI key in Settings → Integration first.' })
      return
    }

    items.value.push({ id: nextId(), kind: 'user', text: trimmed })
    conversation.value.push({ role: 'user', content: [{ type: 'text', text: trimmed }] })
    sending.value = true

    try {
      await runAgent(conversation.value, {
        onAssistantText(t) {
          items.value.push({ id: nextId(), kind: 'assistant', text: t })
        },
        onToolCall(name) {
          const item: ChatItem = { id: nextId(), kind: 'tool', name, status: 'running', summary: TOOL_VERB[name] ?? name }
          runningTool.value = item
          items.value.push(item)
        },
        onToolResult(_name, _content, isError) {
          if (runningTool.value && runningTool.value.kind === 'tool') {
            runningTool.value.status = isError ? 'error' : 'done'
          }
          runningTool.value = null
        },
      })
    } catch (e) {
      items.value.push({ id: nextId(), kind: 'error', text: e instanceof Error ? e.message : 'The assistant hit an error.' })
    } finally {
      sending.value = false
      runningTool.value = null
    }
  }

  return { isOpen, config, configured, sending, items, open, close, toggle, reset, send, loadConfig }
})
