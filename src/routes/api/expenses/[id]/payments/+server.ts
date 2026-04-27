import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { createPayment } from '$lib/data/payments.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json()
  const result = await E.runPromise(E.either(createPayment({
    expense_id: params.id,
    date: body.date,
    amount_cad: body.amount_cad,
    amount_original: body.amount_original ?? body.amount_cad,
    currency_original: body.currency_original ?? 'CAD',
    notes: body.notes ?? null,
    tags: []
  })))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ payment: result.right }, { status: 201 })
}
