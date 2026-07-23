import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// One SQLite file per project, in the repo root as data/superbird.db. This is
// the "move the folder, it runs" file (git-ignored).
const here = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.SUPERBIRD_DB ?? resolve(here, '../../data/superbird.db')

mkdirSync(dirname(DB_PATH), { recursive: true })
const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Idempotent bootstrap. A migration toolchain (drizzle-kit) can replace this
// once the schema stabilises; for now CREATE TABLE IF NOT EXISTS is enough and
// stays in lockstep with schema.ts.
export function ensureSchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'admin',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_state (
      project_id TEXT PRIMARY KEY REFERENCES projects(id),
      document TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_design TEXT,
      published_at TEXT
    );
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      label TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'manual',
      document TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      folder_id TEXT,
      alt TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_folders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      parent_id TEXT
    );
  `)

  // Migrate older DBs that predate the publish columns.
  for (const col of ['published_design TEXT', 'published_at TEXT']) {
    try {
      sqlite.exec(`ALTER TABLE project_state ADD COLUMN ${col}`)
    } catch {
      // column already exists — ignore
    }
  }
}
