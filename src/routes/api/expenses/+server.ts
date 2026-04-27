import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { createExpense, listExpenses } from '$lib/data/expenses.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'
import type { ExpenseCategory, ExpenseRecurrence } from '$lib/data/types.js'

export const GET: RequestHandler = async () => {
  const result = await E.runPromise(E.either(listExpenses()))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ expenses: result.right, total: result.right.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await E.runPromise(E.either(createExpense({
    name: body.name,
    category: body.category as ExpenseCategory,
    scope: body.scope,
    recurrence: body.recurrence as ExpenseRecurrence,
    status: body.status ?? 'active',
    amount_cad: body.amount_cad,
    amount_original: body.amount_original ?? body.amount_cad,
    currency_original: body.currency_original ?? 'CAD',
    billing_day: body.billing_day ?? null,
    next_due: body.next_due ?? null,
    start_date: body.start_date ?? new Date().toISOString().split('T')[0],
    end_date: null,
    tags: body.tags ?? [],
    notes: body.notes ?? null
  })))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ expense: result.right }, { status: 201 })
}
