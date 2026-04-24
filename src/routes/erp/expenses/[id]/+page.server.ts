import { Effect } from 'effect'
import { error, redirect } from '@sveltejs/kit'
import { getExpense, updateExpense } from '$lib/data/expenses.js'
import { createPayment, listPaymentsForExpense } from '$lib/data/payments.js'
import type { PageServerLoad, Actions } from './$types'

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

export const actions: Actions = {
  recordPayment: async ({ params, request }) => {
    const form = await request.formData()
    const date = form.get('date') as string
    const amount_cad = parseFloat(form.get('amount_cad') as string)
    const amount_original = parseFloat((form.get('amount_original') as string) || String(amount_cad))
    const currency_original = (form.get('currency_original') as string) || 'CAD'
    const notes = (form.get('notes') as string) || null

    await Effect.runPromise(Effect.either(createPayment({
      expense_id: params.id,
      date,
      amount_cad,
      amount_original,
      currency_original: currency_original as 'CAD' | 'USD',
      notes,
      tags: []
    })))

    redirect(303, `/erp/expenses/${params.id}`)
  },

  cancel: async ({ params }) => {
    await Effect.runPromise(Effect.either(updateExpense(params.id, { status: 'cancelled' })))
    redirect(303, `/erp/expenses/${params.id}`)
  }
}
