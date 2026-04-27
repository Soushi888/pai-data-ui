import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { createIncome, listIncome } from '$lib/data/income.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'
import type { AdHocIncome } from '$lib/data/types.js'

export const GET: RequestHandler = async () => {
  const result = await E.runPromise(E.either(listIncome()))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ income: result.right, total: result.right.length })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const result = await E.runPromise(E.either(createIncome({
    name: body.name,
    category: body.category as AdHocIncome['category'],
    scope: body.scope,
    amount_cad: body.amount_cad,
    amount_original: body.amount_original ?? body.amount_cad,
    currency_original: body.currency_original ?? 'CAD',
    date: body.date,
    tags: body.tags ?? [],
    notes: body.notes ?? null
  })))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ income: result.right }, { status: 201 })
}
