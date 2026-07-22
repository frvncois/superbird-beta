import { runTool } from './tools'

// Live MCP bridge: while the editor is open it holds an SSE connection to the
// server and executes tool calls relayed from an external MCP client (Claude
// Code, etc.) against the live stores — so changes appear on the canvas.
let source: EventSource | null = null

export function startMcpBridge(): void {
  if (source) return
  source = new EventSource('/api/mcp/events')
  source.addEventListener('tool', (e) => {
    let payload: { id: string; name: string; input: Record<string, unknown> }
    try {
      payload = JSON.parse((e as MessageEvent).data)
    } catch {
      return
    }
    const result = runTool(payload.name, payload.input)
    void fetch('/api/mcp/result', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: payload.id, content: result.content, isError: result.isError }),
    })
  })
  // EventSource auto-reconnects on error; nothing to do.
}

export function stopMcpBridge(): void {
  source?.close()
  source = null
}
