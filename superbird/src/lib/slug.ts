// URL-safe slug: lowercase, non-alphanumerics → single dashes, trimmed.
// Shared by collection base paths, page/project handles, etc.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
