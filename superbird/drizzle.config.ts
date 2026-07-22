import { defineConfig } from 'drizzle-kit'

// For future drizzle-kit migrations. Runtime bootstrap currently lives in
// server/db/client.ts (ensureSchema); switch to generated migrations here once
// the schema stabilises.
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/superbird.db',
  },
})
