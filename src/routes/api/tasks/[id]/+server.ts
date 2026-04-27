import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getTask, updateTask } from '$lib/data/tasks.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const result = await E.runPromise(E.either(getTask(params.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json(result.right)
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const patch = await request.json()
  const result = await E.runPromise(E.either(updateTask(params.id, patch)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ task: result.right })
}
