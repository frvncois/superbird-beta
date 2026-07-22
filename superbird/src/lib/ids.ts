// A per-load random token keeps ids created this session from ever colliding
// with ids loaded from a persisted project (whose counters started from 0 in a
// previous session). Within a session, the incrementing counter guarantees
// uniqueness; the token guarantees it across sessions.
const SESSION_TOKEN = Math.random().toString(36).slice(2, 8)

export function createIdGenerator(prefix: string): () => string {
  let counter = 0
  return () => `${prefix}-${SESSION_TOKEN}${++counter}`
}

export const generateNodeId = createIdGenerator('node')
export const generateComponentId = createIdGenerator('comp')
export const generatePageId = createIdGenerator('page')
export const generateInteractionId = createIdGenerator('ix')
export const generateStepId = createIdGenerator('step')
export const generateMediaId = createIdGenerator('media')
export const generateFolderId = createIdGenerator('folder')
export const generateRedirectId = createIdGenerator('redirect')
export const generateFieldId = createIdGenerator('field')
export const generateCollectionId = createIdGenerator('col')
export const generateEntryId = createIdGenerator('entry')
