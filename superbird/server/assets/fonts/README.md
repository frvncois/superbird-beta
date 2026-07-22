# Default (bundled) fonts

Drop default font files here (`.woff2` recommended), then register them in
`src/data/defaultFonts.ts` with `faces` pointing at `/fonts/<filename>`.

These files are committed (shipped with the app) and served publicly at
`/fonts/:file` — the same route as uploaded fonts, which live (git-ignored) in
`data/fonts/`. Uploaded files win on name collision; otherwise this dir is the
fallback.
