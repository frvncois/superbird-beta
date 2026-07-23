import { eq, and } from 'drizzle-orm'
import { db } from '../db/client'
import { customers } from '../db/schema'
import { hashPassword, verifyPassword, DUMMY_HASH } from './password'
import { randomId } from './ids'

type Row = typeof customers.$inferSelect

export function findCustomerByEmail(projectId: string, email: string): Row | undefined {
  return db
    .select()
    .from(customers)
    .where(and(eq(customers.projectId, projectId), eq(customers.email, email.toLowerCase())))
    .get()
}

export function getCustomer(id: string): Row | undefined {
  return db.select().from(customers).where(eq(customers.id, id)).get()
}

export interface CreateCustomerInput {
  email: string
  name?: string
  password?: string // optional — a guest created at checkout has none yet
}

export function createCustomer(projectId: string, input: CreateCustomerInput): Row {
  const id = randomId('cust')
  db.insert(customers)
    .values({
      id,
      projectId,
      email: input.email.toLowerCase(),
      name: input.name ?? '',
      passwordHash: input.password ? hashPassword(input.password) : '',
      createdAt: new Date().toISOString(),
    })
    .run()
  return getCustomer(id)!
}

export function setCustomerPassword(id: string, password: string): void {
  db.update(customers).set({ passwordHash: hashPassword(password) }).where(eq(customers.id, id)).run()
}

// Verify credentials. Runs equal scrypt work whether or not the account exists
// (no timing enumeration), and rejects accounts with no password set.
export function verifyCustomer(projectId: string, email: string, password: string): Row | null {
  const row = findCustomerByEmail(projectId, email)
  const ok = verifyPassword(password, row?.passwordHash || DUMMY_HASH)
  return row && row.passwordHash && ok ? row : null
}
