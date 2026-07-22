// Client seam for the fonts API — uploading custom font faces. Mirrors
// src/lib/api.ts usage.
import { apiUpload, apiPost } from '@/lib/api'
import type { FontFaceDTO } from '@shared/types'

export function uploadFontFace(
  file: File,
  weight: string,
  style: 'normal' | 'italic',
): Promise<FontFaceDTO> {
  const form = new FormData()
  form.append('file', file)
  form.append('weight', weight)
  form.append('style', style)
  return apiUpload('/api/fonts/upload', form)
}

// Delete the self-hosted files backing a removed font family.
export function deleteFontFiles(urls: string[]): Promise<{ ok: boolean }> {
  return apiPost('/api/fonts/delete', { urls })
}
