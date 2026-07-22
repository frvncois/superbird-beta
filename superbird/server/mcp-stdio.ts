import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { AI_TOOL_DEFS } from '../shared/aiTools'

// Standalone MCP server that Claude Code (or any MCP client) launches. It's a
// thin bridge: it advertises Superbird's tools and forwards each call to the
// running Superbird server's /api/mcp/tool, which routes it to the open editor
// (live) or the saved project (headless).
//
// Point it at a running Superbird with SUPERBIRD_URL (default localhost:3001).

const BASE = process.env.SUPERBIRD_URL ?? 'http://localhost:3001'

const server = new Server(
  { name: 'superbird', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: AI_TOOL_DEFS.map((d) => ({ name: d.name, description: d.description, inputSchema: d.input_schema })),
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params
  try {
    const res = await fetch(`${BASE}/api/mcp/tool`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, input: args ?? {} }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { content: [{ type: 'text', text: `Superbird error (${res.status}): ${text.slice(0, 200)}` }], isError: true }
    }
    const data = (await res.json()) as { content?: string; isError?: boolean }
    return { content: [{ type: 'text', text: String(data.content ?? '') }], isError: !!data.isError }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'request failed'
    return { content: [{ type: 'text', text: `Could not reach Superbird at ${BASE}: ${msg}` }], isError: true }
  }
})

async function main() {
  await server.connect(new StdioServerTransport())
  // Log to stderr (stdout is the MCP protocol channel).
  console.error(`Superbird MCP server connected → ${BASE}`)
}
main().catch((e) => {
  console.error('MCP server failed:', e)
  process.exit(1)
})
