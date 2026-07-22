import { apiGet, apiPut, apiPost } from '@/lib/api'
import type { AiChatRequest, AiChatResponse, AiConfigPublic, AiConfigUpdate } from '@shared/types'

export function getAiConfig(): Promise<AiConfigPublic> {
  return apiGet('/api/ai/config')
}

export function saveAiConfig(update: AiConfigUpdate): Promise<AiConfigPublic> {
  return apiPut('/api/ai/config', update)
}

export function aiChat(req: AiChatRequest): Promise<AiChatResponse> {
  return apiPost('/api/ai/chat', req)
}
