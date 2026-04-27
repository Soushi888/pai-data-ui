import { existsSync } from 'node:fs'
import { Effect as E } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { Payment, EntityWithBody } from './types.js'

const dir = () => dataPath('ERP', 'payments')
const filePath = (id: string) => `${dir()}/${id}.md`

/**
 * Lists all payments from the SQLite index.
 * @returns Effect resolving to Payment[], or failing with DataError.
 */
export function listPayments(): E.Effect<Payment[], DataError> {
  return E.try({
    try: () => listByType<Payment>('payment'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single payment by ID with its markdown body.
 * @param id - Payment identifier.
 * @returns Effect resolving to entity data and markdown body, or failing with DataError.
 */
export function getPayment(id: string): E.Effect<EntityWithBody<Payment>, DataError> {
  return requireEntity<Payment>(filePath(id), id)
}

/**
 * Lists all payments associated with a specific expense.
 * @param expenseId - The expense identifier to filter by.
 * @returns Effect resolving to Payment[] for the given expense, or failing with DataError.
 */
export function listPaymentsForExpense(expenseId: string): E.Effect<Payment[], DataError> {
  return E.map(listPayments(), (payments) =>
    payments.filter((p) => p.expense_id === expenseId)
  )
}

/**
 * Lists all payments recorded in a given calendar month.
 * @param ym - Month string in YYYY-MM format (e.g. "2026-04").
 * @returns Effect resolving to Payment[] for that month, or failing with DataError.
 */
export function listPaymentsForMonth(ym: string): E.Effect<Payment[], DataError> {
  return E.map(listPayments(), (payments) =>
    payments.filter((p) => p.date.startsWith(ym))
  )
}

/**
 * Creates a new payment. The ID is auto-generated as "pay-{expense-slug}-{YYYY-MM}".
 * @param data - Payment fields excluding id and type.
 * @returns Effect resolving to the created Payment, or failing with DataError.
 */
export function createPayment(
  data: Omit<Payment, 'id' | 'type' | 'created'>
): E.Effect<Payment, DataError> {
  const expenseSlug = data.expense_id.replace('exp-', '')
  const ym = data.date.slice(0, 7)
  const id = `pay-${expenseSlug}-${ym}`
  if (existsSync(filePath(id))) {
    return E.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  const payment: Payment = {
    ...data,
    id,
    type: 'payment',
    created: new Date().toISOString().split('T')[0]
  }
  return E.map(
    writeEntity(filePath(id), payment as unknown as Record<string, unknown>, ''),
    () => payment
  )
}
