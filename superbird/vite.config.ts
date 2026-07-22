import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // The admin app lives under /admin so the public SSR site can own "/".
  // The router reads this via import.meta.env.BASE_URL, so every route and link
  // is prefixed automatically.
  base: '/admin/',
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Admin API → Hono (same-origin → cookies work).
      '/api': 'http://localhost:3001',
      // Public SSR site → Hono. Everything that isn't the admin app (/admin,
      // where all Vite dev internals live thanks to base) or the API. This
      // makes localhost:5173/ serve the published site, mirroring production
      // (one origin: /admin = app, / = public site).
      '^/(?!admin(?:/|$)|api(?:/|$)).*': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
