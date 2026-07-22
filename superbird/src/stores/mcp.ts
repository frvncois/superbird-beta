import { ref } from 'vue'
import { defineStore } from 'pinia'

// Live-control state for the MCP bridge. While an external MCP client (Claude
// Code) is actively driving the editor, `active` is true and the UI locks so the
// user can't fight the assistant's edits. `paused` lets the user take over.
export const useMcpStore = defineStore('mcp', () => {
  const connected = ref(false)
  const active = ref(false) // the assistant is mid-edit (auto-clears when idle)
  const paused = ref(false) // the user took over; incoming calls are refused
  const lastAction = ref('')
  const actionCount = ref(0)

  let idleTimer: ReturnType<typeof setTimeout> | null = null
  // Stay locked for a beat after each tool call so we don't flicker between the
  // rapid calls of a build.
  const IDLE_MS = 5000

  function clearTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  function setConnected(v: boolean) {
    connected.value = v
    if (!v) release()
  }

  // A tool call arrived. Returns false if the user has paused control (the caller
  // should refuse the call instead of running it).
  function noteTool(summary: string): boolean {
    if (paused.value) return false
    active.value = true
    lastAction.value = summary
    actionCount.value++
    clearTimer()
    idleTimer = setTimeout(release, IDLE_MS)
    return true
  }

  function release() {
    active.value = false
    clearTimer()
  }

  function pause() {
    paused.value = true
    release()
  }
  function resume() {
    paused.value = false
  }

  return { connected, active, paused, lastAction, actionCount, setConnected, noteTool, release, pause, resume }
})
