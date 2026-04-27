import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getOpportunity, updateOpportunity } from '$lib/data/opportunities.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(getOpportunity(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json(result.right)
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const patch = await request.json()
  const result = await E.runPromise(E.either(updateOpportunity(params.id, patch)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ opportunity: result.right })
}
