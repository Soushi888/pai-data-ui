import { Effect } from 'effect'
import { redirect } from '@sveltejs/kit'
import { createIncome, listIncome } from '$lib/data/income.js'
import type { AdHocIncome } from '$lib/data/types.js'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listIncome()))
  const income = result._tag === 'Right' ? result.right : []
  income.sort((a, b) => b.date.localeCompare(a.date))
  const totalThisYear = income
    .filter((i) => i.date.startsWith(new Date().getFullYear().toString()))
    .reduce((s, i) => s + i.amount_cad, 0)
  return { income, totalThisYear }
}

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData()
    const name = form.get('name') as string
    const category = form.get('category') as string
    const scope = form.get('scope') as string
    const amount_cad = parseFloat(form.get('amount_cad') as string)
    const amount_original = parseFloat((form.get('amount_original') as string) || String(amount_cad))
    const currency_original = (form.get('currency_original') as string) || 'CAD'
    const date = form.get('date') as string
    const notes = (form.get('notes') as string) || null
    const tagsRaw = form.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

    const result = await Effect.runPromise(Effect.either(createIncome({
      name,
      category: category as AdHocIncome['category'],
      scope: scope as 'personal' | 'freelance',
      amount_cad,
      amount_original,
      currency_original: currency_original as 'CAD' | 'USD',
      date,
      tags,
      notes
    })))

    if (result._tag === 'Right') {
      redirect(303, '/erp/income')
    }
    return { error: 'Failed to create income record' }
  }
}
