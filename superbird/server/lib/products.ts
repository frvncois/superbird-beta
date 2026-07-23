import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { products, orderItems } from '../db/schema'
import { randomId } from './ids'
import { storeCurrency } from './store'

export interface ProductDTO {
  id: string
  entryId?: string
  title: string
  price: number // minor units (cents)
  currency: string
  stock: number | null
  active: boolean
  archived: boolean
  hasOrders: boolean
  createdAt: string
}

type Row = typeof products.$inferSelect

// Which of these product rows have ever appeared in an order.
function orderedProductIds(ids: string[]): Set<string> {
  if (!ids.length) return new Set()
  const rows = db.select({ pid: orderItems.productId }).from(orderItems).where(inArray(orderItems.productId, ids)).all()
  return new Set(rows.map((r) => r.pid).filter((x): x is string => !!x))
}

function toDTO(row: Row, ordered: Set<string>): ProductDTO {
  return {
    id: row.id,
    entryId: row.entryId ?? undefined,
    title: row.title,
    price: row.price,
    currency: row.currency,
    stock: row.stock ?? null,
    active: row.active === 1,
    archived: row.archived === 1,
    hasOrders: ordered.has(row.id),
    createdAt: row.createdAt,
  }
}

// All commerce rows for the project (incl. archived, so the client can hide
// those entries). The client merges these with its Products-collection entries.
export function listProducts(projectId: string): ProductDTO[] {
  const rows = db.select().from(products).where(eq(products.projectId, projectId)).all()
  const ordered = orderedProductIds(rows.map((r) => r.id))
  return rows.map((r) => toDTO(r, ordered))
}

function rowByEntry(projectId: string, entryId: string): Row | undefined {
  return db.select().from(products).where(and(eq(products.projectId, projectId), eq(products.entryId, entryId))).get()
}

// Create/update the commerce row for a product entry.
export function upsertProduct(
  projectId: string,
  input: { entryId: string; title?: string; price?: number; stock?: number | null; active?: boolean },
): ProductDTO {
  const existing = rowByEntry(projectId, input.entryId)
  const now = new Date().toISOString()
  if (existing) {
    const set: Partial<Row> = { updatedAt: now }
    if (input.title !== undefined) set.title = input.title
    if (input.price !== undefined) set.price = Math.max(0, Math.round(input.price))
    if (input.stock !== undefined) set.stock = input.stock
    if (input.active !== undefined) set.active = input.active ? 1 : 0
    db.update(products).set(set).where(eq(products.id, existing.id)).run()
  } else {
    db.insert(products)
      .values({
        id: randomId('prod'),
        projectId,
        entryId: input.entryId,
        title: input.title ?? '',
        price: Math.max(0, Math.round(input.price ?? 0)),
        currency: storeCurrency(projectId),
        stock: input.stock ?? null,
        active: input.active === false ? 0 : 1,
        archived: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }
  const row = rowByEntry(projectId, input.entryId)!
  return toDTO(row, orderedProductIds([row.id]))
}

export type RemoveMode = 'deleted' | 'offline' | 'noop'

// Remove a product: hard-delete if it never had an order, otherwise take it
// offline (soft) so order history stays intact.
export function removeProduct(projectId: string, entryId: string): RemoveMode {
  const row = rowByEntry(projectId, entryId)
  if (!row) return 'deleted' // no commerce row — caller just drops the entry
  const ordered = orderedProductIds([row.id])
  if (ordered.has(row.id)) {
    db.update(products).set({ active: 0, updatedAt: new Date().toISOString() }).where(eq(products.id, row.id)).run()
    return 'offline'
  }
  db.delete(products).where(eq(products.id, row.id)).run()
  return 'deleted'
}

// ── Storefront ──

export interface CatalogItem {
  entryId: string
  title: string
  price: number
  currency: string
  stock: number | null
}

// Public catalog: buyable products only (active, not archived, has an entry).
export function listCatalog(projectId: string): CatalogItem[] {
  return db
    .select()
    .from(products)
    .where(eq(products.projectId, projectId))
    .all()
    .filter((r) => r.active === 1 && r.archived === 0 && r.entryId)
    .map((r) => ({ entryId: r.entryId!, title: r.title, price: r.price, currency: r.currency, stock: r.stock ?? null }))
}

// A single buyable product by entry (for cart validation).
export function getPurchasable(projectId: string, entryId: string): Row | null {
  const row = rowByEntry(projectId, entryId)
  return row && row.active === 1 && row.archived === 0 ? row : null
}

export function decrementStock(productId: string, qty: number): void {
  const row = db.select().from(products).where(eq(products.id, productId)).get()
  if (!row || row.stock === null) return
  db.update(products).set({ stock: Math.max(0, row.stock - qty), updatedAt: new Date().toISOString() }).where(eq(products.id, productId)).run()
}

// Archive: hide from the store (kept for order history). Creates a row if needed.
export function archiveProduct(projectId: string, entryId: string, title: string): void {
  const row = rowByEntry(projectId, entryId)
  const now = new Date().toISOString()
  if (row) {
    db.update(products).set({ archived: 1, active: 0, updatedAt: now }).where(eq(products.id, row.id)).run()
  } else {
    db.insert(products)
      .values({ id: randomId('prod'), projectId, entryId, title, price: 0, currency: storeCurrency(projectId), stock: null, active: 0, archived: 1, createdAt: now, updatedAt: now })
      .run()
  }
}
