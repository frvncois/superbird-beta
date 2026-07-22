import { runTool } from './tools'
import { useMcpStore } from '@/stores/mcp'

// Live MCP bridge: while the editor is open it holds an SSE connection to the
// server and executes tool calls relayed from an external MCP client (Claude
// Code, etc.) against the live stores — so changes appear on the canvas. It also
// drives the control-lock state so the user can't edit while the assistant does.
let source: EventSource | null = null

// Friendly labels for the lock's status line.
const VERB: Record<string, string> = {
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

function post(id: string, content: string, isError: boolean) {
  void fetch('/api/mcp/result', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, content, isError }),
  })
}

export function startMcpBridge(): void {
  if (source) return
  const mcp = useMcpStore()
  source = new EventSource('/api/mcp/events')
  source.addEventListener('ready', () => mcp.setConnected(true))
  source.addEventListener('tool', (e) => {
    let payload: { id: string; name: string; input: Record<string, unknown> }
    try {
      payload = JSON.parse((e as MessageEvent).data)
    } catch {
      return
    }
    // User took over — refuse the call so the assistant knows to stop.
    if (!mcp.noteTool(VERB[payload.name] ?? payload.name)) {
      post(payload.id, 'The user has taken manual control of the editor. Ask them to resume the assistant before continuing.', true)
      return
    }
    const result = runTool(payload.name, payload.input)
    post(payload.id, result.content, result.isError)
  })
  source.onerror = () => mcp.setConnected(false) // EventSource auto-reconnects; 'ready' re-fires
}

export function stopMcpBridge(): void {
  source?.close()
  source = null
  useMcpStore().setConnected(false)
}
