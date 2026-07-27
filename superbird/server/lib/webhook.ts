import { safeFetch } from './safeFetch'

// Best-effort POST of a submission to a form's configured webhook. Never throws
// (a failing/hanging/blocked webhook must not break the visitor's submission).
// Goes through safeFetch: http(s) only, SSRF-guarded (no private/loopback/
// metadata targets), redirects refused, 8s timeout.
export async function postWebhook(url: string, payload: unknown): Promise<void> {
  try {
    await safeFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // swallow — delivery is best-effort (includes blocked-target rejections)
  }
}
