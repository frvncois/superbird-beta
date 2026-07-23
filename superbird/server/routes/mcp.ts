import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { streamSSE } from 'hono/streaming'
import { AI_TOOL_DEFS } from '../../shared/aiTools'
import { runHeadless } from '../lib/mcpHeadless'
import { requireAuth } from '../lib/session'
import { randomHex } from '../lib/ids'

// The MCP bridge. An external MCP client (e.g. Claude Code, via the stdio server)
// calls POST /api/mcp/tool. If a Superbird editor is connected over SSE we relay
// the call to it (live — runs against the open canvas); otherwise we apply it
// headlessly to the saved project document.
//
// Security: OFF unless SUPERBIRD_MCP_TOKEN is set (fail-closed, safe to deploy).
// The external-client endpoints (tool/tools/status) require that token; the
// editor endpoints (events/result) require an admin session.

const mcp = new Hono()

// Read lazily so setting/rotating the env doesn't require code changes.
function mcpToken(): string {
  return process.env.SUPERBIRD_MCP_TOKEN ?? ''
}

// Guards the endpoints an external MCP client hits.
async function requireToken(c: Context, next: Next): Promise<Response | void> {
  const token = mcpToken()
  if (!token) return c.json({ error: 'MCP bridge is disabled. Set SUPERBIRD_MCP_TOKEN to enable it.' }, 403)
  if (c.req.header('x-superbird-mcp-token') !== token) return c.json({ error: 'Invalid MCP token.' }, 401)
  await next()
}

// External MCP client → token. Editor (browser) → admin session.
mcp.use('/mcp/tool', requireToken)
mcp.use('/mcp/tools', requireToken)
mcp.use('/mcp/status', requireToken)
mcp.use('/mcp/events', requireAuth)
mcp.use('/mcp/result', requireAuth)

interface EditorConn {
  send: (payload: unknown) => Promise<void>
}
const editors = new Set<EditorConn>()
const pending = new Map<string, (r: { content: string; isError: boolean }) => void>()

const RESULT_TIMEOUT_MS = 45000

mcp.get('/mcp/tools', (c) => c.json({ tools: AI_TOOL_DEFS }))
mcp.get('/mcp/status', (c) => c.json({ editorConnected: editors.size > 0 }))

// A Superbird editor connects here and receives tool-call events to execute.
mcp.get('/mcp/events', (c) =>
  streamSSE(c, async (stream) => {
    const conn: EditorConn = {
      send: (payload) => stream.writeSSE({ event: 'tool', data: JSON.stringify(payload) }),
    }
    editors.add(conn)
    await stream.writeSSE({ event: 'ready', data: '1' })
    await new Promise<void>((resolve) => stream.onAbort(resolve))
    editors.delete(conn)
  }),
)

// The editor posts a tool result back.
mcp.post('/mcp/result', async (c) => {
  const { id, content, isError } = (await c.req.json()) as { id: string; content: string; isError?: boolean }
  const resolve = pending.get(id)
  if (resolve) {
    resolve({ content: String(content ?? ''), isError: !!isError })
    pending.delete(id)
  }
  return c.json({ ok: true })
})

// An MCP client calls a tool. Live (relay to editor) if connected, else headless.
mcp.post('/mcp/tool', async (c) => {
  const { name, input } = (await c.req.json()) as { name: string; input: Record<string, unknown> }
  const editor = [...editors][0]
  if (editor) {
    const id = randomHex(8)
    const result = new Promise<{ content: string; isError: boolean }>((resolve) => {
      pending.set(id, resolve)
      setTimeout(() => {
        if (pending.delete(id)) resolve({ content: 'The Superbird editor did not respond in time.', isError: true })
      }, RESULT_TIMEOUT_MS)
    })
    try {
      await editor.send({ id, name, input })
    } catch {
      pending.delete(id)
      return c.json(runHeadless(name, input)) // editor dropped mid-flight
    }
    return c.json(await result)
  }
  return c.json(runHeadless(name, input))
})

export default mcp
