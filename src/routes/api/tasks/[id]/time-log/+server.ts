import { json } from '@sveltejs/kit'
import { Effect } from 'effect'
import { appendTimeLog } from '$lib/data/tasks.js'
import { errorResponse } from '$lib/server/response.js'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params, request }) => {
  const entry = await request.json()
  if (!entry.date || !entry.hours) {
    return json({ type: '/errors/validation-error', status: 400, detail: 'date and hours required' }, { status: 400 })
  }
  const result = await Effect.runPromise(Effect.either(appendTimeLog(params.id, entry)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ task: result.right })
}
