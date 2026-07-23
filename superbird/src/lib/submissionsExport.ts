// Download a scoped submissions export (CSV/JSON) as a file. Auth flows via the
// session cookie; errors surface as thrown Errors rather than a JSON error page.
export async function downloadSubmissions(params: {
  formId?: string
  from?: string
  to?: string
  format: 'csv' | 'json'
}): Promise<void> {
  const q = new URLSearchParams()
  if (params.formId) q.set('formId', params.formId)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  q.set('format', params.format)

  const res = await fetch(`/api/forms/submissions/export?${q.toString()}`)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Export failed (${res.status})`)
  }
  const disposition = res.headers.get('content-disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `submissions.${params.format}`

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
