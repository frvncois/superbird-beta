import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { storeConfig } from '../db/schema'

// A Stripe client built from the project's stored secret key, or null when the
// store hasn't been configured with one.
export function getStripe(projectId: string): Stripe | null {
  const row = db.select().from(storeConfig).where(eq(storeConfig.projectId, projectId)).get()
  if (!row?.stripeSecretKey) return null
  return new Stripe(row.stripeSecretKey)
}

export function getWebhookSecret(projectId: string): string {
  return db.select().from(storeConfig).where(eq(storeConfig.projectId, projectId)).get()?.stripeWebhookSecret ?? ''
}
