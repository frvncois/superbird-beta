import { Hono } from 'hono'
import { requireAuth } from '../lib/session'
import { getInstalledProject } from '../lib/project'
import { getStoreConfigForClient, setStoreConfig, type StoreConfigPatch } from '../lib/store'
import { listProducts, upsertProduct, removeProduct, archiveProduct } from '../lib/products'
import { listOrders, updateOrderStatus, listCustomers, ordersByCustomer } from '../lib/orders'

const store = new Hono()

// Admin-only store administration. (Public storefront + Stripe webhook live in
// their own unguarded routers, added in later tasks.)
store.use('*', requireAuth)

store.get('/store/config', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json(getStoreConfigForClient(proj.id))
})

store.put('/store/config', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as StoreConfigPatch
  setStoreConfig(proj.id, body)
  return c.json(getStoreConfigForClient(proj.id))
})

// ── Products (commerce rows; content lives in the client's collection entries) ──

store.get('/store/products', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ products: listProducts(proj.id) })
})

store.put('/store/products', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json()) as { entryId?: string; title?: string; price?: number; stock?: number | null; active?: boolean }
  if (!body.entryId) return c.json({ error: 'Missing entryId.' }, 400)
  return c.json(upsertProduct(proj.id, { entryId: body.entryId, title: body.title, price: body.price, stock: body.stock, active: body.active }))
})

store.delete('/store/products/:entryId', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ mode: removeProduct(proj.id, c.req.param('entryId')) })
})

store.post('/store/products/:entryId/archive', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const body = (await c.req.json().catch(() => ({}))) as { title?: string }
  archiveProduct(proj.id, c.req.param('entryId'), body.title ?? '')
  return c.json({ ok: true })
})

// ── Orders ──

store.get('/store/orders', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ orders: listOrders(proj.id, c.req.query('status') || undefined) })
})

store.patch('/store/orders/:id', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const { status } = (await c.req.json()) as { status?: string }
  const order = updateOrderStatus(proj.id, c.req.param('id'), status ?? '')
  if (!order) return c.json({ error: 'Invalid order or status.' }, 400)
  return c.json(order)
})

// ── Customers ──

store.get('/store/customers', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ customers: listCustomers(proj.id) })
})

store.get('/store/customers/:id/orders', (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  return c.json({ orders: ordersByCustomer(proj.id, c.req.param('id')) })
})

export default store
