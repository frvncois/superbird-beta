// HTML/attribute escaping for the render pipeline. One home so html.ts and
// index.ts can't drift (they previously had two attr escapers, one missing `>`).

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

// A valid HTML attribute name (author-supplied custom-attribute keys are checked
// against this before emission, so a key can't inject extra attributes/handlers).
const ATTR_NAME = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/
export function isValidAttrName(name: string): boolean {
  return ATTR_NAME.test(name)
}
