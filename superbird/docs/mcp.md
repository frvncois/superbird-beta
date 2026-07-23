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

### TODO

- **Headless coverage**: `add_interaction` and `set_translation` aren't
  implemented in `server/lib/mcpHeadless.ts` yet — with no editor open they reply
  "open the editor". Live mode covers them. Implement them on the saved-doc JSON
  to close the gap.

## Connect Claude Code

This is a **stdio** MCP server: "stdio" is the MCP *transport* — Claude Code
launches `mcp-stdio.ts` as a subprocess and exchanges JSON-RPC over its
**stdin/stdout** (so stdout stays clean; logs go to stderr). It is **not** an
HTTP endpoint — do not `claude mcp add --transport http …`. `:3001` is the
Superbird web/API server the stdio process talks to *internally* (`/api/mcp/*`).

The bridge is **disabled unless `SUPERBIRD_MCP_TOKEN` is set** (fail-closed).

1. Start Superbird with a token (any random string), so the API on
   `http://localhost:3001` accepts the bridge:

   ```sh
   SUPERBIRD_MCP_TOKEN=my-dev-secret npm run dev
   ```
2. Register the MCP server. Pass the **same token** (and `SUPERBIRD_URL` if the
   API isn't at localhost:3001) via `-e`, and use **absolute paths** so it
   launches from any working directory:

   ```sh
   claude mcp add superbird \
     -e SUPERBIRD_MCP_TOKEN=my-dev-secret \
     -- /ABSOLUTE/PATH/TO/superbird/node_modules/.bin/tsx \
        /ABSOLUTE/PATH/TO/superbird/server/mcp-stdio.ts
   ```
3. **Restart Claude Code** — newly added MCP servers only load on restart. Then
   `claude mcp list` should show `superbird`.
4. For **live** editing, keep the Superbird **editor open** in a browser. Then in
   Claude Code: *“In Superbird, build a landing page with a hero and three
   feature cards.”* Edits appear on the canvas as it works. With no editor open,
   edits apply headlessly to the saved project.

## Security & deployment

- **Fail-closed:** with no `SUPERBIRD_MCP_TOKEN`, `/api/mcp/tool|tools|status`
  return 403 (bridge off). So it's safe by default in production — you opt in by
  setting the token.
- **Auth split:** the external-client endpoints (`tool`/`tools`/`status`) require
  the `x-superbird-mcp-token` header; the editor endpoints (`events`/`result`)
  require an authenticated admin session.
- **Deploying behind a proxy:** to point the local stdio server at a hosted
  Superbird, set `-e SUPERBIRD_URL=https://your-domain.com` and the token. Two
  proxy caveats: (1) the token travels in a header, so **use HTTPS**; (2) the
  **live** path uses Server-Sent Events — disable proxy buffering for
  `/api/mcp/events` (nginx: `proxy_buffering off;` + `proxy_read_timeout` high),
  or the live bridge hangs. Headless works without SSE.
- Keep the token secret; rotate it by restarting with a new value.
