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
      // Admin API — proxied to the Hono server in dev (same-origin → cookies work).
      '/api': 'http://localhost:3001',
    },
  },
})
