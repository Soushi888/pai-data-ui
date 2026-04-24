import { Effect } from 'effect'
import { redirect } from '@sveltejs/kit'
import { createExpense, listExpenses } from '$lib/data/expenses.js'
import type { ExpenseCategory, ExpenseRecurrence } from '$lib/data/types.js'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listExpenses()))
  const expenses = result._tag === 'Right' ? result.right : []
  expenses.sort((a, b) => a.name.localeCompare(b.name))

  const monthlyCommitted = expenses
    .filter((e) => e.status === 'active' && e.recurrence === 'monthly')
    .reduce((sum, e) => sum + e.amount_cad, 0)

  return { expenses, monthlyCommitted }
}

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData()
    const name = form.get('name') as string
    const category = form.get('category') as string
    const scope = form.get('scope') as string
    const recurrence = form.get('recurrence') as string
    const amount_cad = parseFloat(form.get('amount_cad') as string)
    const amount_original = parseFloat((form.get('amount_original') as string) || String(amount_cad))
    const currency_original = (form.get('currency_original') as string) || 'CAD'
    const billing_day = recurrence === 'monthly' ? parseInt(form.get('billing_day') as string) || null : null
    const next_due = recurrence !== 'monthly' ? (form.get('next_due') as string) || null : null
    const start_date = (form.get('start_date') as string) || new Date().toISOString().split('T')[0]
    const status = (form.get('status') as string) || 'active'
    const notes = (form.get('notes') as string) || null
    const tagsRaw = form.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

    const result = await Effect.runPromise(Effect.either(createExpense({
      name,
      category: category as ExpenseCategory,
      scope: scope as 'personal' | 'freelance' | 'mixed',
      recurrence: recurrence as ExpenseRecurrence,
      status: status as 'active' | 'planned' | 'cancelled',
      amount_cad,
      amount_original,
      currency_original: currency_original as 'CAD' | 'USD',
      billing_day,
      next_due,
      start_date,
      end_date: null,
      tags,
      notes
    })))

    if (result._tag === 'Right') {
      redirect(303, `/erp/expenses/${result.right.id}`)
    }
    return { error: 'Failed to create expense' }
  }
}
