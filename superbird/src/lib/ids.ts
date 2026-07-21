export function createIdGenerator(prefix: string): () => string {
  let counter = 0
  return () => `${prefix}-${++counter}`
}

export const generateNodeId = createIdGenerator('node')
export const generateComponentId = createIdGenerator('comp')
export const generatePageId = createIdGenerator('page')
export const generateInteractionId = createIdGenerator('ix')
export const generateStepId = createIdGenerator('step')
export const generateMediaId = createIdGenerator('media')
export const generateFolderId = createIdGenerator('folder')
export const generateRedirectId = createIdGenerator('redirect')
