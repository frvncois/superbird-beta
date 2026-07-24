import { eq, and, desc, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { orders, orderItems, customers } from '../db/schema'
import { randomId } from './ids'
import { getPurchasable, decrementStock } from './products'
import { storeCurrency } from './store'
import { findCustomerByEmail, createCustomer } from './customers'

// The admin-settable order lifecycle (pending is internal, pre-payment).
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
const SPENT_STATUSES = new Set(['paid', 'shipped', 'completed'])

export interface CartLine {
  entryId: string
  qty: number
}

export interface ValidatedLine {
  productId: string
  entryId: string
  title: string
  unitPrice: number
  qty: number
}

export class CartError extends Error {}

// Validate a cart against server-owned product data. Prices/stock come from the
// DB — never the client. Throws CartError on any problem.
export function validateCart(projectId: string, cart: CartLine[]): { lines: ValidatedLine[]; subtotal: number } {
  if (!cart.length) throw new CartError('Your cart is empty.')
  const lines: ValidatedLine[] = []
  let subtotal = 0
  for (const item of cart) {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 0))
    const product = getPurchasable(projectId, item.entryId)
    if (!product) throw new CartError('A product in your cart is no longer available.')
    if (product.stock !== null && product.stock < qty) throw new CartError(`“${product.title}” is out of stock.`)
    lines.push({ productId: product.id, entryId: item.entryId, title: product.title, unitPrice: product.price, qty })
    subtotal += product.price * qty
  }
  return { lines, subtotal }
}

// Create a pending order + items (before redirecting to Stripe). Fulfilled by
// the webhook once payment succeeds.
export function createPendingOrder(projectId: string, lines: ValidatedLine[], subtotal: number, email = ''): string {
  const id = randomId('order')
  const now = new Date().toISOString()
  db.insert(orders)
    .values({
      id,
      projectId,
      email,
      status: 'pending',
      currency: storeCurrency(projectId),
      subtotal,
      total: subtotal,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  for (const l of lines) {
    db.insert(orderItems).values({ id: randomId('oi'), orderId: id, productId: l.productId, title: l.title, unitPrice: l.unitPrice, qty: l.qty }).run()
  }
  return id
}

export function attachSession(orderId: string, sessionId: string): void {
  db.update(orders).set({ stripeSessionId: sessionId, updatedAt: new Date().toISOString() }).where(eq(orders.id, orderId)).run()
}

export interface FulfillInput {
  orderId: string
  email?: string
  paymentIntent?: string
  shipping?: unknown
}

// Mark a pending order paid: link/create the customer, decrement stock. Safe to
// call more than once (Stripe retries webhooks) — a paid order is left alone.
export function fulfillOrder(projectId: string, input: FulfillInput): 'ok' | 'noop' {
  const order = db.select().from(orders).where(eq(orders.id, input.orderId)).get()
  if (!order || order.projectId !== projectId) return 'noop'
  if (order.status !== 'pending') return 'noop' // already fulfilled

  let customerId: string | null = null
  const email = (input.email ?? order.email ?? '').toLowerCase()
  if (email) {
    const existing = findCustomerByEmail(projectId, email)
    customerId = existing ? existing.id : createCustomer(projectId, { email }).id
  }

  db.update(orders)
    .set({
      status: 'paid',
      email: email || order.email,
      customerId,
      stripePaymentIntent: input.paymentIntent ?? null,
      shipping: input.shipping ? JSON.stringify(input.shipping) : order.shipping,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(orders.id, order.id))
    .run()

  for (const it of db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all()) {
    if (it.productId) decrementStock(it.productId, it.qty)
  }
  return 'ok'
}

// ── Reads (admin + confirmation) ──

export interface OrderDTO {
  id: string
  email: string
  status: string
  currency: string
  subtotal: number
  total: number
  customerId?: string
  createdAt: string
  items: { title: string; unitPrice: number; qty: number }[]
}

type OrderItemDTO = { title: string; unitPrice: number; qty: number }

function mapOrder(row: typeof orders.$inferSelect, items: OrderItemDTO[]): OrderDTO {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    currency: row.currency,
    subtotal: row.subtotal,
    total: row.total,
    customerId: row.customerId ?? undefined,
    createdAt: row.createdAt,
    items,
  }
}

function toDTO(row: typeof orders.$inferSelect): OrderDTO {
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, row.id)).all()
  return mapOrder(row, items.map((i) => ({ title: i.title, unitPrice: i.unitPrice, qty: i.qty })))
}

// Batch variant: one query for all items across the given orders (avoids the
// per-order N+1). Preserves the input order.
function toDTOs(rows: (typeof orders.$inferSelect)[]): OrderDTO[] {
  if (!rows.length) return []
  const items = db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))).all()
  const byOrder = new Map<string, OrderItemDTO[]>()
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? []
    list.push({ title: it.title, unitPrice: it.unitPrice, qty: it.qty })
    byOrder.set(it.orderId, list)
  }
  return rows.map((row) => mapOrder(row, byOrder.get(row.id) ?? []))
}

export function getOrderBySession(sessionId: string): OrderDTO | null {
  const row = db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).get()
  return row ? toDTO(row) : null
}

export function listOrders(projectId: string, status?: string): OrderDTO[] {
  const rows = db
    .select()
    .from(orders)
    .where(status ? and(eq(orders.projectId, projectId), eq(orders.status, status)) : eq(orders.projectId, projectId))
    .orderBy(desc(orders.createdAt))
    .all()
  // Hide never-completed pending checkouts unless explicitly requested.
  return toDTOs(rows.filter((o) => status !== undefined || o.status !== 'pending'))
}

export function updateOrderStatus(projectId: string, id: string, status: string): OrderDTO | null {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) return null
  const row = db.select().from(orders).where(eq(orders.id, id)).get()
  if (!row || row.projectId !== projectId) return null
  db.update(orders).set({ status, updatedAt: new Date().toISOString() }).where(eq(orders.id, id)).run()
  return toDTO({ ...row, status })
}

export function ordersByCustomer(projectId: string, customerId: string): OrderDTO[] {
  const rows = db
    .select()
    .from(orders)
    .where(and(eq(orders.projectId, projectId), eq(orders.customerId, customerId)))
    .orderBy(desc(orders.createdAt))
    .all()
  return toDTOs(rows)
}

// ── Customers (admin) ──

export interface CustomerDTO {
  id: string
  email: string
  name: string
  createdAt: string
  orderCount: number
  totalSpent: number
  currency: string
}

export function listCustomers(projectId: string): CustomerDTO[] {
  const rows = db.select().from(customers).where(eq(customers.projectId, projectId)).all()
  const currency = storeCurrency(projectId)
  // One project-wide orders query, grouped by customer — not one query per row.
  const orderRows = db.select().from(orders).where(eq(orders.projectId, projectId)).all()
  const byCustomer = new Map<string, (typeof orders.$inferSelect)[]>()
  for (const o of orderRows) {
    if (!o.customerId) continue
    const list = byCustomer.get(o.customerId) ?? []
    list.push(o)
    byCustomer.set(o.customerId, list)
  }
  return rows
    .map((cu) => {
      const custOrders = byCustomer.get(cu.id) ?? []
      const counted = custOrders.filter((o) => o.status !== 'pending')
      const totalSpent = custOrders.filter((o) => SPENT_STATUSES.has(o.status)).reduce((s, o) => s + o.total, 0)
      return { id: cu.id, email: cu.email, name: cu.name, createdAt: cu.createdAt, orderCount: counted.length, totalSpent, currency }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
