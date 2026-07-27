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
      created_at TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      totp_recovery TEXT
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
      private INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_folders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      parent_id TEXT,
      private INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      form_id TEXT NOT NULL,
      form_name TEXT NOT NULL,
      data TEXT NOT NULL,
      page_url TEXT,
      ip TEXT,
      seen INTEGER NOT NULL DEFAULT 0,
      email_status TEXT NOT NULL DEFAULT 'skipped',
      emailed_to TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      reason TEXT NOT NULL,
      label TEXT NOT NULL,
      document TEXT NOT NULL,
      hash TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      page_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      anchor TEXT NOT NULL,
      replies TEXT NOT NULL DEFAULT '[]',
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS smtp_config (
      project_id TEXT PRIMARY KEY REFERENCES projects(id),
      host TEXT NOT NULL DEFAULT '',
      port INTEGER NOT NULL DEFAULT 587,
      secure INTEGER NOT NULL DEFAULT 0,
      username TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL DEFAULT '',
      from_email TEXT NOT NULL DEFAULT '',
      from_name TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    -- Secondary index for the hot submissions list (kept in lockstep with the
    -- index() declaration in schema.ts). Without it, the submissions query
    -- full-scans its table.
    CREATE INDEX IF NOT EXISTS idx_submissions_project_created ON submissions(project_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_project_page ON comments(project_id, page_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_project_created ON snapshots(project_id, created_at);
  `)

  // Migrate older DBs that predate later columns.
  const migrations: Array<[string, string]> = [
    ['project_state', 'published_design TEXT'],
    ['project_state', 'published_at TEXT'],
    ['media', 'private INTEGER NOT NULL DEFAULT 0'],
    ['media_folders', 'private INTEGER NOT NULL DEFAULT 0'],
    ['users', 'totp_secret TEXT'],
    ['users', 'totp_enabled INTEGER NOT NULL DEFAULT 0'],
    ['users', 'totp_recovery TEXT'],
  ]
  for (const [table, col] of migrations) {
    try {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`)
    } catch {
      // column already exists — ignore
    }
  }
}
