# MCP integration — drive Superbird from Claude Code

Superbird exposes its builder capabilities as an **MCP server**, so you can build
and edit your site from an external AI client (Claude Code, Claude Desktop,
Cursor, …) using *its* model — no API key stored in Superbird.

## How it works

```
Claude Code ⇄ server/mcp-stdio.ts ⇄ POST /api/mcp/tool ⇄ ┌ live: SSE → open editor → runs on the canvas
                                                          └ headless: mutates the saved project document
```

- `server/mcp-stdio.ts` — the process Claude Code launches. It advertises the
  same ~21 tools (`shared/aiTools.ts`) and forwards each call to the running
  Superbird server.
- `server/routes/mcp.ts` — the bridge. If a Superbird **editor tab is open** it
  relays the call over SSE to that tab, which runs it against the live stores
  (`src/lib/ai/bridge.ts` + the browser tool executors) — changes appear on the
  canvas and autosave. If **no editor is open**, it applies the call headlessly
  to the saved document (`server/lib/mcpHeadless.ts`), visible next time you open
  Superbird. A few tools (animations, translations) are editor-only.

The tool schemas live in `shared/aiTools.ts` — one source of truth shared by the
in-app assistant, the headless executor, and the MCP server.

## Connect Claude Code

1. Start Superbird: `npm run dev` (the API must be on `http://localhost:3001`).
2. Register the MCP server (from the `superbird/` directory):

   ```sh
   claude mcp add superbird -- npx tsx server/mcp-stdio.ts
   ```

   Point it elsewhere with `SUPERBIRD_URL` (default `http://localhost:3001`).
3. For **live** editing, keep the Superbird **editor open** in a browser. Then in
   Claude Code: *“In Superbird, build a landing page with a hero and three
   feature cards.”* Edits appear on the canvas as it works.

## Security note

The `/api/mcp/*` routes are **not** session-guarded — it's a local developer
bridge on the same origin. Only expose Superbird's API port to trusted local
clients. (Publish/SSR runs on separate origins in production and doesn't include
this bridge.)
