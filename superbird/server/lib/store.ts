import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { storeConfig } from '../db/schema'

type Row = typeof storeConfig.$inferSelect

export interface StoreConfigPatch {
  enabled?: boolean
  currency?: string
  stripeSecretKey?: string
  stripePublishableKey?: string
  stripeWebhookSecret?: string
}

// Client-facing shape: the publishable key is public, but the secret key and
// webhook secret are never returned — only whether they're set.
export interface StoreConfigClient {
  enabled: boolean
  currency: string
  stripePublishableKey: string
  hasSecretKey: boolean
  hasWebhookSecret: boolean
}

function getRow(projectId: string): Row | undefined {
  return db.select().from(storeConfig).where(eq(storeConfig.projectId, projectId)).get()
}

export function getStoreConfigForClient(projectId: string): StoreConfigClient {
  const r = getRow(projectId)
  return {
    enabled: r?.enabled === 1,
    currency: r?.currency ?? 'usd',
    stripePublishableKey: r?.stripePublishableKey ?? '',
    hasSecretKey: !!r?.stripeSecretKey,
    hasWebhookSecret: !!r?.stripeWebhookSecret,
  }
}

// Upsert. Secret key + webhook secret are write-only — blank keeps the stored one.
export function setStoreConfig(projectId: string, patch: StoreConfigPatch): void {
  const existing = getRow(projectId)
  const values = {
    projectId,
    enabled: (patch.enabled ?? existing?.enabled === 1) ? 1 : 0,
    currency: (patch.currency ?? existing?.currency ?? 'usd').toLowerCase(),
    stripeSecretKey: patch.stripeSecretKey ? patch.stripeSecretKey : existing?.stripeSecretKey ?? '',
    stripePublishableKey: patch.stripePublishableKey ?? existing?.stripePublishableKey ?? '',
    stripeWebhookSecret: patch.stripeWebhookSecret ? patch.stripeWebhookSecret : existing?.stripeWebhookSecret ?? '',
    updatedAt: new Date().toISOString(),
  }
  db.insert(storeConfig).values(values).onConflictDoUpdate({ target: storeConfig.projectId, set: values }).run()
}

export function isStoreEnabled(projectId: string): boolean {
  return getRow(projectId)?.enabled === 1
}

export function isStripeConfigured(projectId: string): boolean {
  return !!getRow(projectId)?.stripeSecretKey
}

export function storeCurrency(projectId: string): string {
  return getRow(projectId)?.currency ?? 'usd'
}
