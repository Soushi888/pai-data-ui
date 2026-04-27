import { Effect } from 'effect'
import { redirect } from '@sveltejs/kit'
import { createExpense, listExpenses } from '$lib/data/expenses.js'
import type { ExpenseCategory, ExpenseRecurrence } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listExpenses()))
  const expenses = result._tag === 'Right' ? result.right : []
  expenses.sort((a, b) => a.name.localeCompare(b.name))

  const monthlyCommitted = expenses
    .filter((e) => e.status === 'active' && e.recurrence === 'monthly')
    .reduce((sum, e) => sum + e.amount_cad, 0)

  return { expenses, monthlyCommitted }
}
