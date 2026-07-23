// Editor theme (light/dark). The initial class is applied by an inline script
// in index.html (before paint); this persists changes made from the toggle.
const KEY = 'sb_theme'

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function setDark(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}
