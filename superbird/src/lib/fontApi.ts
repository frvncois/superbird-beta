// Client seam for the fonts API (search catalog, import a web font, upload a
// custom face). Mirrors src/lib/api.ts usage.
import { apiGet, apiPost, apiUpload } from '@/lib/api'
import type { FontCatalogEntry, FontFaceDTO, FontFamilyDTO, FontImportPayload } from '@shared/types'

export function searchFonts(
  source: 'google' | 'fontshare',
  q: string,
): Promise<{ items: FontCatalogEntry[] }> {
  return apiGet(`/api/fonts/search?source=${source}&q=${encodeURIComponent(q)}`)
}

export function importFont(payload: FontImportPayload): Promise<FontFamilyDTO> {
  return apiPost('/api/fonts/import', payload)
}

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
