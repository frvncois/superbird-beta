import { Hono } from 'hono'
import { getInstalledProject } from '../lib/project'
import { isStoreEnabled, storeCurrency } from '../lib/store'
import { listCatalog } from '../lib/products'
import { validateCart, createPendingOrder, attachSession, fulfillOrder, getOrderBySession, CartError, type CartLine } from '../lib/orders'
import { getStripe, getWebhookSecret } from '../lib/stripe'
import { currentCustomer } from '../lib/customerSession'
import { hit, clientIp } from '../lib/rateLimit'

// PUBLIC storefront: catalog, checkout, Stripe webhook, order lookup. No admin
// session — the shopper is a customer (or a guest). Prices come from the DB.
const storePublic = new Hono()

function requireStore(): { id: string } | null {
  const proj = getInstalledProject()
  return proj && isStoreEnabled(proj.id) ? proj : null
}

storePublic.get('/store/catalog', (c) => {
  const proj = requireStore()
  if (!proj) return c.json({ error: 'Store unavailable.' }, 409)
  return c.json({ products: listCatalog(proj.id), currency: storeCurrency(proj.id) })
})

// Build a Stripe Checkout Session for the cart. Redirect the browser to `url`.
storePublic.post('/store/checkout', async (c) => {
  const proj = requireStore()
  if (!proj) return c.json({ error: 'Store unavailable.' }, 409)
  const limit = hit(`checkout:${clientIp(c)}`, 20, 60_000)
  if (!limit.ok) return c.json({ error: 'Too many attempts. Try again shortly.' }, 429, { 'Retry-After': String(limit.retryAfter) })

  const stripe = getStripe(proj.id)
  if (!stripe) return c.json({ error: 'Payments are not configured.' }, 503)

  const body = (await c.req.json().catch(() => ({}))) as { items?: CartLine[] }
  let validated
  try {
    validated = validateCart(proj.id, body.items ?? [])
  } catch (e) {
    return c.json({ error: e instanceof CartError ? e.message : 'Invalid cart.' }, 400)
  }

  const currency = storeCurrency(proj.id)
  const email = currentCustomer(c)?.email
  const orderId = createPendingOrder(proj.id, validated.lines, validated.subtotal, email ?? '')

  const origin = new URL(c.req.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: validated.lines.map((l) => ({
        quantity: l.qty,
        price_data: { currency, unit_amount: l.unitPrice, product_data: { name: l.title } },
      })),
      customer_email: email,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId, projectId: proj.id },
    })
    attachSession(orderId, session.id)
    return c.json({ url: session.url })
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Could not start checkout.' }, 502)
  }
})

// Stripe webhook — signature-verified, raw body. Fulfills the order on payment.
storePublic.post('/store/webhook', async (c) => {
  const proj = getInstalledProject()
  if (!proj) return c.json({ error: 'Not installed.' }, 409)
  const stripe = getStripe(proj.id)
  const secret = getWebhookSecret(proj.id)
  if (!stripe || !secret) return c.json({ error: 'Webhook not configured.' }, 503)

  const sig = c.req.header('stripe-signature') ?? ''
  const raw = await c.req.text()
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret)
  } catch {
    return c.json({ error: 'Invalid signature.' }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string; metadata?: { orderId?: string }; payment_intent?: string; customer_details?: { email?: string }; customer_email?: string; shipping_details?: unknown }
    const orderId = session.metadata?.orderId
    if (orderId) {
      fulfillOrder(proj.id, {
        orderId,
        email: session.customer_details?.email ?? session.customer_email ?? undefined,
        paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        shipping: session.shipping_details,
      })
    }
  }
  return c.json({ received: true })
})

// Confirmation page lookup — the Stripe session id is unguessable.
storePublic.get('/store/order', (c) => {
  const sessionId = c.req.query('session_id')
  if (!sessionId) return c.json({ error: 'Missing session.' }, 400)
  const order = getOrderBySession(sessionId)
  if (!order) return c.json({ error: 'Not found.' }, 404)
  return c.json({ order: { status: order.status, total: order.total, currency: order.currency, items: order.items } })
})

export default storePublic
