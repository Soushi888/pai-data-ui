import { Effect } from 'effect'
import { redirect } from '@sveltejs/kit'
import { createIncome, listIncome } from '$lib/data/income.js'
import type { AdHocIncome } from '$lib/data/types.js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const result = await Effect.runPromise(Effect.either(listIncome()))
  const income = result._tag === 'Right' ? result.right : []
  income.sort((a, b) => b.date.localeCompare(a.date))
  const totalThisYear = income
    .filter((i) => i.date.startsWith(new Date().getFullYear().toString()))
    .reduce((s, i) => s + i.amount_cad, 0)
  return { income, totalThisYear }
}
