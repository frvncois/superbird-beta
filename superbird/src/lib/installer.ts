// Install seam — now backed by the API. install() provisions the project +
// admin user server-side and opens a session (cookie).

import { apiPost } from '@/lib/api'
import type { InstallResult, SetupPayload } from '@shared/types'

export function install(payload: SetupPayload): Promise<InstallResult> {
  return apiPost<InstallResult>('/api/install', payload)
}
