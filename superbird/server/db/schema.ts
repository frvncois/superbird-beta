import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Auth/install tables. Content tables (collections, fields, entries, media)
// land in a later slice.

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  handle: text('handle').notNull().unique(),
  createdAt: text('created_at').notNull(),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('admin'),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // opaque session token
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(), // epoch ms
})
