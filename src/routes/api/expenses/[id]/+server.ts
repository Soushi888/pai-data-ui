import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getExpense, updateExpense } from '$lib/data/expenses.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(getExpense(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ expense: result.right.data })
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = await request.json()
  const result = await E.runPromise(E.either(updateExpense(params.id, body)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ expense: result.right })
}
