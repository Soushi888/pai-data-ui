import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getInvoice, updateInvoice } from '$lib/data/invoices.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(getInvoice(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json(result.right)
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const patch = await request.json()
  const result = await E.runPromise(E.either(updateInvoice(params.id, patch)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ invoice: result.right })
}
