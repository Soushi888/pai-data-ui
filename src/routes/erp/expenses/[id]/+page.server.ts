import { Effect } from 'effect'
import { error } from '@sveltejs/kit'
import { getExpense, updateExpense } from '$lib/data/expenses.js'
import { createPayment, listPaymentsForExpense } from '$lib/data/payments.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const [expResult, payResult] = await Promise.all([
    Effect.runPromise(Effect.either(getExpense(params.id))),
    Effect.runPromise(Effect.either(listPaymentsForExpense(params.id)))
  ])

  if (expResult._tag === 'Left') throw error(404, 'Expense not found')

  const payments = payResult._tag === 'Right' ? payResult.right : []
  payments.sort((a, b) => b.date.localeCompare(a.date))

  return {
    expense: expResult.right.data,
    body: expResult.right.body,
    payments
  }
}
