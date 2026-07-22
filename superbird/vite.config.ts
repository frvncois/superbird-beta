import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// Redirect the bare /admin → /admin/ in dev, so visiting /admin just works
// instead of hitting Vite's base-URL notice.
function adminTrailingSlash(): Plugin {
  return {
    name: 'admin-trailing-slash',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/admin') {
          res.writeHead(301, { Location: '/admin/' })
          res.end()
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // The admin app lives under /admin so the public SSR site can own "/".
  // The router reads this via import.meta.env.BASE_URL, so every route and link
  // is prefixed automatically.
  base: '/admin/',
  plugins: [
    adminTrailingSlash(),
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
