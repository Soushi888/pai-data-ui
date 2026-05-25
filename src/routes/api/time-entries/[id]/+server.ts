import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getTimeEntry, updateTimeEntry, deleteTimeEntry } from '$lib/data/time-entries.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(getTimeEntry(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json(result.right)
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const patch = await request.json()
  const result = await E.runPromise(E.either(updateTimeEntry(params.id, patch)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ entry: result.right })
}

export const DELETE: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(deleteTimeEntry(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return new Response(null, { status: 204 })
}
