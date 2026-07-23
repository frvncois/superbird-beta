// Best-effort POST of a submission to a form's configured webhook. Never throws
// (a failing/hanging webhook must not break the visitor's submission).
export async function postWebhook(url: string, payload: unknown): Promise<void> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8_000)
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
  } catch {
    // swallow — delivery is best-effort
  } finally {
    clearTimeout(timer)
  }
}
