import { existsSync } from 'node:fs'
import { Effect } from 'effect'
import type { DataError } from './errors.js'
import { FileNotFoundError, ParseError } from './errors.js'
import { dataPath, requireEntity, writeEntity } from './parser.js'
import { listByType } from '$lib/server/index-db.js'
import type { Payment, EntityWithBody } from './types.js'

const dir = () => dataPath('ERP', 'payments')
const filePath = (id: string) => `${dir()}/${id}.md`

export function listPayments(): Effect.Effect<Payment[], DataError> {
  return Effect.try({
    try: () => listByType<Payment>('payment'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

export function getPayment(id: string): Effect.Effect<EntityWithBody<Payment>, DataError> {
  return requireEntity<Payment>(filePath(id), id)
}

export function listPaymentsForExpense(expenseId: string): Effect.Effect<Payment[], DataError> {
  return Effect.map(listPayments(), (payments) =>
    payments.filter((p) => p.expense_id === expenseId)
  )
}

export function listPaymentsForMonth(ym: string): Effect.Effect<Payment[], DataError> {
  return Effect.map(listPayments(), (payments) =>
    payments.filter((p) => p.date.startsWith(ym))
  )
}

export function createPayment(
  data: Omit<Payment, 'id' | 'type' | 'created'>
): Effect.Effect<Payment, DataError> {
  const expenseSlug = data.expense_id.replace('exp-', '')
  const ym = data.date.slice(0, 7)
  const id = `pay-${expenseSlug}-${ym}`
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: 'conflict' }))
  }
  const payment: Payment = {
    ...data,
    id,
    type: 'payment',
    created: new Date().toISOString().split('T')[0]
  }
  return Effect.map(
    writeEntity(filePath(id), payment as unknown as Record<string, unknown>, ''),
    () => payment
  )
}
