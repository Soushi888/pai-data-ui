import { Effect as E } from 'effect'
import { listPayments } from '$lib/data/payments.js'
import { listExpenses } from '$lib/data/expenses.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const [paymentsResult, expensesResult] = await Promise.all([
    E.runPromise(E.either(listPayments())),
    E.runPromise(E.either(listExpenses())),
  ])

  const allPayments = paymentsResult._tag === 'Right' ? paymentsResult.right : []
  const allExpenses = expensesResult._tag === 'Right' ? expensesResult.right : []

  const expenseMap = new Map(allExpenses.map((e) => [e.id, e]))

  const payments = allPayments
    .map((p) => {
      const exp = expenseMap.get(p.expense_id)
      return {
        ...p,
        expense_name: exp?.name ?? p.expense_id,
        expense_category: exp?.category ?? 'other',
        expense_scope: exp?.scope ?? 'personal',
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const thisYear = new Date().getFullYear().toString()
  const years = [...new Set(payments.map((p) => Number(p.date.slice(0, 4))))].sort((a, b) => b - a)

  return {
    payments,
    years,
    totalAllTime: payments.reduce((sum, p) => sum + p.amount_cad, 0),
    totalThisYear: payments
      .filter((p) => p.date.startsWith(thisYear))
      .reduce((sum, p) => sum + p.amount_cad, 0),
    countAllTime: payments.length,
  }
}
