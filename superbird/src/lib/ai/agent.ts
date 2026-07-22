import { aiChat } from './aiApi'
import { TOOL_DEFS, runTool } from './tools'
import type { AiBlock, AiMessage, AiToolUseBlock } from '@shared/types'

export const SYSTEM_PROMPT = `You are the Superbird Assistant — an AI that builds and edits real websites directly inside the Superbird visual builder by calling tools. Your tool calls mutate the live project (they autosave and are undoable), so the user sees changes appear on the canvas as you work.

How to work:
- ALWAYS call get_overview first to see the existing pages, collections, locales, style classes and design tokens before making changes. Use get_page_tree / get_node to inspect structure before editing it.
- Build real, well-structured layouts: use semantic containers (section > container > content), headings, text, buttons, images. Add nodes into parents by passing parentId.
- Prefer reusable style classes (create_style_class / set_node_styles with a className) over one-off instance styles, and reuse existing style classes and design tokens (colors/fonts/sizes) you find in the overview. You may also apply Tailwind utility classes (e.g. "flex", "gap-4", "p-6", "text-center", "md:flex-row", "hover:opacity-80") directly.
- For responsive design, set styles per breakpoint (desktop → tablet → mobile) or use Tailwind responsive prefixes. For states use state: "hover" etc.
- You can add animations/interactions (add_interaction), links (set_node_link), translations (add_locale + set_translation), and CMS collections + entries (create_collection, add_entry, set_entry_value).
- Work incrementally and verify with get_page_tree when unsure. Keep going until the request is fully done, then give a short summary of what you built. Ask a brief clarifying question only if the request is truly ambiguous.
- Be concise in your text; let the tools do the work. Node/page/collection ids come from tool results — use them.`

export interface AgentEvents {
  onAssistantText?: (text: string) => void
  onToolCall?: (name: string, input: Record<string, unknown>) => void
  onToolResult?: (name: string, content: string, isError: boolean) => void
}

// Cap the tool-use loop so a confused model can't run forever.
const MAX_ITERATIONS = 24

/**
 * Run the agent loop against the given conversation (mutated in place: the
 * assistant + tool_result turns are appended). Each turn is proxied through the
 * server (which holds the API key); tool calls execute in the browser against
 * the live stores.
 */
export async function runAgent(messages: AiMessage[], events: AgentEvents = {}): Promise<void> {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const res = await aiChat({ system: SYSTEM_PROMPT, messages, tools: TOOL_DEFS })
    messages.push({ role: 'assistant', content: res.content })

    for (const b of res.content) {
      if (b.type === 'text' && b.text.trim()) events.onAssistantText?.(b.text)
    }

    const toolUses = res.content.filter((b): b is AiToolUseBlock => b.type === 'tool_use')
    if (!toolUses.length) return // end_turn

    const results: AiBlock[] = []
    for (const tu of toolUses) {
      events.onToolCall?.(tu.name, tu.input)
      const r = runTool(tu.name, tu.input)
      events.onToolResult?.(tu.name, r.content, r.isError)
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: r.content, is_error: r.isError })
    }
    messages.push({ role: 'user', content: results })
  }
  events.onAssistantText?.('(Stopped after reaching the maximum number of steps. Ask me to continue.)')
}
