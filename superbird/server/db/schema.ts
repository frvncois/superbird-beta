import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

// Auth/install + project tables. The editable project (design + content) is one
// JSON document in project_state; media/backups/submissions have their own tables.

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
  // TOTP 2FA: base32 secret, enabled flag, and JSON array of SHA-256-hashed
  // single-use recovery codes. Null/0 until the user enrolls.
  totpSecret: text('totp_secret'),
  totpEnabled: integer('totp_enabled').notNull().default(0),
  totpRecovery: text('totp_recovery'),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // opaque session token
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(), // epoch ms
})

// Media metadata. The bytes live on disk (data/media/), never in SQLite.
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  name: text('name').notNull(),
  filename: text('filename').notNull(), // on-disk name in data/media/
  mime: text('mime').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  folderId: text('folder_id'),
  alt: text('alt'),
  tags: text('tags').notNull().default('[]'), // JSON string[]
  // 1 = private: served only to an authenticated admin, never on the public site.
  private: integer('private').notNull().default(0),
  createdAt: text('created_at').notNull(),
})

// Point-in-time snapshots of the working document (design + content). Media/font
// bytes are NOT duplicated here — they live on disk and are shared across
// snapshots; a full portable copy is produced on demand by the export endpoint.
export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  label: text('label').notNull(),
  kind: text('kind').notNull().default('manual'), // 'manual' | 'auto'
  document: text('document').notNull(), // JSON snapshot of the working document
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
})

// SMTP credentials for outgoing mail. One row per project. Kept out of the
// exportable document/backup — a secret that never leaves the server.
export const smtpConfig = sqliteTable('smtp_config', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id),
  host: text('host').notNull().default(''),
  port: integer('port').notNull().default(587),
  secure: integer('secure').notNull().default(0), // 1 = TLS on connect (port 465)
  username: text('username').notNull().default(''),
  password: text('password').notNull().default(''),
  fromEmail: text('from_email').notNull().default(''),
  fromName: text('from_name').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
})

// Form submissions from the published site. Admin-only (never served publicly).
export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  formId: text('form_id').notNull(), // the form node's id
  formName: text('form_name').notNull(), // snapshot of the form name at submit time
  data: text('data').notNull(), // JSON: field name -> value
  pageUrl: text('page_url'), // where it was submitted from
  ip: text('ip'),
  seen: integer('seen').notNull().default(0), // 1 once an admin opened it
  emailStatus: text('email_status').notNull().default('skipped'), // skipped | sent | failed
  emailedTo: text('emailed_to'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('idx_submissions_project_created').on(t.projectId, t.createdAt)])

// Editor-only annotation threads ("comments"). Logged-in users drop a pin on
// the canvas anchored to a node; each row is a thread (replies embedded as JSON).
// Never served on the public site and never bundled into exports — an editor
// collaboration surface that stays on the server.
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  pageId: text('page_id').notNull(), // which page's canvas the pin lives on
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(), // snapshot of the author's name
  body: text('body').notNull(),
  anchor: text('anchor').notNull(), // JSON: { nodeId, nx, ny } (nx/ny = 0..1 of node rect)
  replies: text('replies').notNull().default('[]'), // JSON CommentReply[]
  resolved: integer('resolved').notNull().default(0), // 1 once marked resolved
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [index('idx_comments_project_page').on(t.projectId, t.pageId)])

export const mediaFolders = sqliteTable('media_folders', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  name: text('name').notNull(),
  parentId: text('parent_id'),
  // 1 = private: this folder and everything inside it is admin-only (cascade).
  private: integer('private').notNull().default(0),
})

// The whole editable project as one JSON document (design + content). A later
// slice normalises content into queryable rows for the SSR runtime.
export const projectState = sqliteTable('project_state', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id),
  document: text('document').notNull(), // working project JSON (design + content)
  updatedAt: text('updated_at').notNull(),
  // Published design snapshot (JSON of ProjectDesign) — the public site serves
  // this, not the working design. Null until the first Publish.
  publishedDesign: text('published_design'),
  publishedAt: text('published_at'),
})
