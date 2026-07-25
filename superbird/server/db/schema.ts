import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

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

// ── Store / commerce ──

// Stripe keys + store toggle. Secret — kept out of the exportable backup, like
// smtp_config. One row per project.
export const storeConfig = sqliteTable('store_config', {
  projectId: text('project_id')
    .primaryKey()
    .references(() => projects.id),
  enabled: integer('enabled').notNull().default(0),
  currency: text('currency').notNull().default('usd'),
  stripeSecretKey: text('stripe_secret_key').notNull().default(''),
  stripePublishableKey: text('stripe_publishable_key').notNull().default(''),
  stripeWebhookSecret: text('stripe_webhook_secret').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
})

// Authoritative commerce data for a product. Content (title/desc/images/layout)
// lives in the linked CMS entry; price/stock/Stripe ids live here (server-owned).
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  entryId: text('entry_id'), // linked Products-collection entry (nullable)
  title: text('title').notNull().default(''),
  price: integer('price').notNull().default(0), // minor units (cents)
  currency: text('currency').notNull().default('usd'),
  stock: integer('stock'), // null = unlimited
  active: integer('active').notNull().default(1), // 0 = offline
  archived: integer('archived').notNull().default(0),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [index('idx_products_project_entry').on(t.projectId, t.entryId)])

// Customers — a fully separate identity space from admin `users`.
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  passwordHash: text('password_hash').notNull().default(''),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('idx_customers_project_email').on(t.projectId, t.email)])

export const customerSessions = sqliteTable('customer_sessions', {
  id: text('id').primaryKey(), // opaque token
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  createdAt: text('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
})

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  customerId: text('customer_id'), // nullable — guest checkout
  email: text('email').notNull().default(''),
  status: text('status').notNull().default('pending'), // pending|paid|shipped|completed|cancelled|refunded
  currency: text('currency').notNull().default('usd'),
  subtotal: integer('subtotal').notNull().default(0),
  total: integer('total').notNull().default(0),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntent: text('stripe_payment_intent'),
  shipping: text('shipping'), // JSON: name/address
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  index('idx_orders_session').on(t.stripeSessionId),
  index('idx_orders_project_created').on(t.projectId, t.createdAt),
  index('idx_orders_customer').on(t.customerId),
])

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  productId: text('product_id'), // nullable — product may later be deleted
  title: text('title').notNull(),
  unitPrice: integer('unit_price').notNull(),
  qty: integer('qty').notNull(),
}, (t) => [index('idx_order_items_order').on(t.orderId)])

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
